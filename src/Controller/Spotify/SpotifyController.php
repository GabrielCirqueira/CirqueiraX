<?php

declare(strict_types=1);

namespace App\Controller\Spotify;

use App\Controller\Common\DefaultController;
use App\DataObject\Spotify\ConcluirAutorizacaoSpotifyDTO;
use App\DataObject\Spotify\ConsultarImagensSpotifyDTO;
use App\DataObject\Spotify\UploadImportacaoSpotifyDTO;
use App\Entity\ImagemSpotify;
use App\Entity\Usuario;
use App\Enum\TipoImagemSpotify;
use App\Message\BuscarImagemSpotifyMessage;
use App\Repository\ImagemSpotifyRepository;
use App\Serializer\ContaSpotifySerializer;
use App\Serializer\ImportacaoSpotifySerializer;
use App\Service\Spotify\ConcluirAutorizacaoSpotifyService;
use App\Service\Spotify\ConsultarImportacaoSpotifyService;
use App\Service\Spotify\DesconectarSpotifyService;
use App\Service\Spotify\GerarUrlAutorizacaoSpotifyService;
use App\Service\Spotify\IniciarImportacaoSpotifyService;
use App\Service\Spotify\ObterStatusSpotifyService;
use App\Service\Spotify\ResolverImagemSpotifyService;
use App\Service\Spotify\SincronizarAgoraSpotifyService;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/spotify', name: 'api_spotify_')]
final class SpotifyController extends DefaultController
{
    public function __construct(
        private readonly GerarUrlAutorizacaoSpotifyService $gerarUrlAutorizacaoService,
        private readonly ConcluirAutorizacaoSpotifyService $concluirAutorizacaoService,
        private readonly ObterStatusSpotifyService $obterStatusService,
        private readonly DesconectarSpotifyService $desconectarService,
        private readonly IniciarImportacaoSpotifyService $iniciarImportacaoService,
        private readonly ConsultarImportacaoSpotifyService $consultarImportacaoService,
        private readonly SincronizarAgoraSpotifyService $sincronizarAgoraService,
        private readonly ResolverImagemSpotifyService $resolverImagemService,
        private readonly ImagemSpotifyRepository $imagemRepository,
        private readonly ContaSpotifySerializer $contaSpotifySerializer,
        private readonly ImportacaoSpotifySerializer $importacaoSpotifySerializer,
        private readonly LoggerInterface $logger,
    ) {
    }

    #[Route('/oauth/url', name: 'oauth_url', methods: ['GET'])]
    public function obterUrlAutorizacao(#[CurrentUser] Usuario $usuario): Response
    {
        $dados = $this->gerarUrlAutorizacaoService->executar($usuario);

        return $this->success($dados);
    }

    #[Route('/oauth/concluir', name: 'oauth_concluir', methods: ['POST'])]
    public function concluirAutorizacao(
        #[CurrentUser] Usuario $usuario,
        #[MapRequestPayload] ConcluirAutorizacaoSpotifyDTO $dto,
    ): Response {
        $conta = $this->concluirAutorizacaoService->executar($usuario, $dto->code, $dto->state);

        return $this->success($this->contaSpotifySerializer->serializar($conta));
    }

    #[Route('/status', name: 'status', methods: ['GET'])]
    public function status(#[CurrentUser] Usuario $usuario): Response
    {
        $status = $this->obterStatusService->executar($usuario);

        return $this->success($this->contaSpotifySerializer->serializarStatus($status));
    }

    #[Route('/sincronizar', name: 'sincronizar', methods: ['POST'])]
    public function sincronizar(#[CurrentUser] Usuario $usuario): Response
    {
        $resultado = $this->sincronizarAgoraService->executar($usuario);

        return $this->success([
            'totalColetadas' => $resultado->totalColetadas,
            'totalNovas' => $resultado->totalNovas,
            'totalDuplicadas' => $resultado->totalDuplicadas,
        ]);
    }

    #[Route('/desconectar', name: 'desconectar', methods: ['POST'])]
    public function desconectar(#[CurrentUser] Usuario $usuario): Response
    {
        $reproducoesRemovidas = $this->desconectarService->executar($usuario);

        return $this->success([
            'desconectado' => true,
            'reproducoesRemovidas' => $reproducoesRemovidas,
        ]);
    }

    #[Route('/importacoes', name: 'iniciar_importacao', methods: ['POST'])]
    public function importar(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $dto = UploadImportacaoSpotifyDTO::fromRequest($request);
        $importacao = $this->iniciarImportacaoService->executar($dto, $usuario);

        return $this->created($this->importacaoSpotifySerializer->serializar($importacao));
    }

    #[Route('/importacoes/{uuid}', name: 'consultar_importacao', methods: ['GET'])]
    public function consultarImportacao(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $importacao = $this->consultarImportacaoService->executar($uuid, $usuario);

        return $this->success($this->importacaoSpotifySerializer->serializar($importacao));
    }

    #[Route('/imagens/consultar', name: 'consultar_imagens', methods: ['POST'])]
    public function consultarImagens(
        #[CurrentUser] Usuario $usuario,
        #[MapRequestPayload] ConsultarImagensSpotifyDTO $dto,
    ): Response {
        $imagens = $this->imagemRepository->buscarMapeamentoPorChaves($dto->chaves);
        $resultado = [];
        $resolvidasNestaRequisicao = 0;
        $maximoParaResolver = 20;

        foreach ($dto->chaves as $chave) {
            $imagem = $imagens[$chave] ?? null;

            if (($imagem === null || $imagem->primeiraImagemUrl() === null) && $resolvidasNestaRequisicao < $maximoParaResolver) {
                $mensagem = $this->criarMensagemAPartirDaChave($usuario, $chave, $imagem);
                if (null !== $mensagem) {
                    try {
                        $this->resolverImagemService->executar($mensagem);
                        $imagem = $this->imagemRepository->buscarPorChaveBusca($chave);
                        $resolvidasNestaRequisicao++;
                    } catch (\Throwable $e) {
                        $this->logger->warning('Falha ao resolver imagem sob demanda.', [
                            'chave' => $chave,
                            'erro' => $e->getMessage(),
                        ]);
                    }
                }
            }

            $resultado[$chave] = [
                'chave' => $chave,
                'status' => $imagem?->status()->value ?? 'nao_cadastrada',
                'imagemUrl' => $imagem?->primeiraImagemUrl(),
                'urlSpotify' => $imagem?->urlSpotify(),
            ];
        }

        return $this->success($resultado);
    }

    private function criarMensagemAPartirDaChave(
        Usuario $usuario,
        string $chave,
        ?ImagemSpotify $imagem,
    ): ?BuscarImagemSpotifyMessage {
        if (null !== $imagem) {
            return new BuscarImagemSpotifyMessage(
                usuarioId: (int) $usuario->getId(),
                tipo: $imagem->tipo(),
                nome: $imagem->nome(),
                artista: $imagem->artista(),
                codigoSpotify: $imagem->codigoSpotify(),
                duracaoMs: $imagem->duracaoMs(),
            );
        }

        if (str_starts_with($chave, 'artista:codigo:')) {
            $codigo = substr($chave, strlen('artista:codigo:'));

            return new BuscarImagemSpotifyMessage(
                usuarioId: (int) $usuario->getId(),
                tipo: TipoImagemSpotify::Artista,
                nome: $codigo,
                artista: null,
                codigoSpotify: $codigo,
            );
        }

        if (str_starts_with($chave, 'artista:nome:')) {
            $nome = substr($chave, strlen('artista:nome:'));

            return new BuscarImagemSpotifyMessage(
                usuarioId: (int) $usuario->getId(),
                tipo: TipoImagemSpotify::Artista,
                nome: $nome,
                artista: null,
                codigoSpotify: null,
            );
        }

        if (str_starts_with($chave, 'faixa:codigo:')) {
            $codigo = substr($chave, strlen('faixa:codigo:'));

            return new BuscarImagemSpotifyMessage(
                usuarioId: (int) $usuario->getId(),
                tipo: TipoImagemSpotify::Faixa,
                nome: $codigo,
                artista: null,
                codigoSpotify: $codigo,
            );
        }

        if (str_starts_with($chave, 'faixa:nome:')) {
            $partes = explode('|', substr($chave, strlen('faixa:nome:')), 2);
            $artista = $partes[0] ?? '';
            $nome = $partes[1] ?? '';

            return new BuscarImagemSpotifyMessage(
                usuarioId: (int) $usuario->getId(),
                tipo: TipoImagemSpotify::Faixa,
                nome: $nome,
                artista: $artista,
                codigoSpotify: null,
            );
        }

        return null;
    }
}
