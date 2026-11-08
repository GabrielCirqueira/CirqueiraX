<?php

declare(strict_types=1);

namespace App\Controller\Spotify;

use App\Controller\Common\DefaultController;
use App\DataObject\Spotify\ConcluirAutorizacaoSpotifyDTO;
use App\DataObject\Spotify\ConsultarImagensSpotifyDTO;
use App\DataObject\Spotify\ItemTopMusicaArtistaDTO;
use App\DataObject\Spotify\UploadImportacaoSpotifyDTO;
use App\Entity\ImagemSpotify;
use App\Entity\Usuario;
use App\Enum\TipoImagemSpotify;
use App\Message\BuscarImagemSpotifyMessage;
use App\Repository\ImagemSpotifyRepository;
use App\Serializer\ContaSpotifySerializer;
use App\Serializer\ImportacaoSpotifySerializer;
use App\Serializer\SpotifyCapsulaSerializer;
use App\Serializer\SpotifyResumoSerializer;
use App\Service\Spotify\ConcluirAutorizacaoSpotifyService;
use App\Service\Spotify\ConsultarImportacaoSpotifyService;
use App\Service\Spotify\DesconectarSpotifyService;
use App\Service\Spotify\GerarUrlAutorizacaoSpotifyService;
use App\Service\Spotify\IniciarImportacaoSpotifyService;
use App\Service\Spotify\ListarMesesCapsulaService;
use App\Service\Spotify\ObterDetalheCapsulaService;
use App\Service\Spotify\ObterResumoHojeSemanaCuriosidadesService;
use App\Service\Spotify\ObterResumoIntervaloPersonalizadoService;
use App\Service\Spotify\ObterStatusSpotifyService;
use App\Service\Spotify\ObterTopMusicasArtistaService;
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
        private readonly ListarMesesCapsulaService $listarMesesCapsulaService,
        private readonly ObterDetalheCapsulaService $obterDetalheCapsulaService,
        private readonly ObterResumoHojeSemanaCuriosidadesService $obterResumoService,
        private readonly ObterResumoIntervaloPersonalizadoService $obterResumoIntervaloService,
        private readonly ObterTopMusicasArtistaService $obterTopMusicasArtistaService,
        private readonly SincronizarAgoraSpotifyService $sincronizarAgoraService,
        private readonly ResolverImagemSpotifyService $resolverImagemService,
        private readonly ImagemSpotifyRepository $imagemRepository,
        private readonly ContaSpotifySerializer $contaSpotifySerializer,
        private readonly ImportacaoSpotifySerializer $importacaoSpotifySerializer,
        private readonly SpotifyCapsulaSerializer $capsulaSerializer,
        private readonly SpotifyResumoSerializer $resumoSerializer,
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
        $conta = $this->obterStatusService->executar($usuario);

        return $this->success($this->contaSpotifySerializer->serializar($conta));
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

    #[Route('/capsula', name: 'listar_capsulas', methods: ['GET'])]
    public function listarCapsulas(#[CurrentUser] Usuario $usuario): Response
    {
        $meses = $this->listarMesesCapsulaService->executar($usuario);

        return $this->success($this->capsulaSerializer->serializarListaMeses($meses));
    }

    #[Route('/capsula/{ano<\d{4}>}/{mes<\d{1,2}>}', name: 'obter_capsula', methods: ['GET'])]
    public function obterCapsula(int $ano, int $mes, #[CurrentUser] Usuario $usuario): Response
    {
        $detalhe = $this->obterDetalheCapsulaService->executar($usuario, $ano, $mes);

        return $this->success($this->capsulaSerializer->serializarCapsula(
            $detalhe->capsula(),
            $detalhe->mapaImagens(),
        ));
    }

    #[Route('/resumo', name: 'obter_resumo', methods: ['GET'])]
    public function obterResumo(#[CurrentUser] Usuario $usuario): Response
    {
        $resumoComImagens = $this->obterResumoService->executar($usuario);

        return $this->success($this->resumoSerializer->serializarResumo(
            $resumoComImagens->resumo(),
            $resumoComImagens->mapaImagens(),
        ));
    }

    #[Route('/ranking', name: 'obter_ranking_intervalo', methods: ['GET'])]
    public function obterRankingIntervalo(
        Request $request,
        #[CurrentUser] Usuario $usuario,
    ): Response {
        $tipo = (string) $request->query->get('tipo', 'dias');
        $dias = $request->query->has('dias') ? $request->query->getInt('dias') : null;
        $ano = $request->query->has('ano') ? $request->query->getInt('ano') : null;
        $mes = $request->query->has('mes') ? $request->query->getInt('mes') : null;
        $inicio = $request->query->has('inicio') ? (string) $request->query->get('inicio') : null;
        $fim = $request->query->has('fim') ? (string) $request->query->get('fim') : null;
        $limite = $request->query->getInt('limite', 50);

        $resultado = $this->obterResumoIntervaloService->executar(
            usuario: $usuario,
            tipo: $tipo,
            dias: $dias,
            ano: $ano,
            mes: $mes,
            inicio: $inicio,
            fim: $fim,
            limite: $limite,
        );

        return $this->success($this->resumoSerializer->serializarIntervaloComPeriodo(
            intervalo: $resultado->intervalo(),
            rotuloPeriodo: $resultado->rotuloPeriodo(),
            dataInicio: $resultado->dataInicio(),
            dataFim: $resultado->dataFim(),
            mapaImagens: $resultado->mapaImagens(),
            topAlbuns: $resultado->topAlbuns(),
        ));
    }

    #[Route('/artistas/top-musicas', name: 'obter_top_musicas_artista', methods: ['GET'])]
    public function obterTopMusicasArtista(
        Request $request,
        #[CurrentUser] Usuario $usuario,
    ): Response {
        $artista = (string) $request->query->get('artista', '');
        if ('' === trim($artista)) {
            return $this->error('O parâmetro "artista" é obrigatório.');
        }

        $topMusicas = $this->obterTopMusicasArtistaService->executar(
            usuario: $usuario,
            nomeArtista: trim($artista),
            album: $request->query->has('album') ? (string) $request->query->get('album') : null,
            tipo: $request->query->has('tipo') ? (string) $request->query->get('tipo') : null,
            dias: $request->query->has('dias') ? $request->query->getInt('dias') : null,
            ano: $request->query->has('ano') ? $request->query->getInt('ano') : null,
            mes: $request->query->has('mes') ? $request->query->getInt('mes') : null,
            inicio: $request->query->has('inicio') ? (string) $request->query->get('inicio') : null,
            fim: $request->query->has('fim') ? (string) $request->query->get('fim') : null,
            limite: $request->query->getInt('limite', ObterTopMusicasArtistaService::LIMITE_PADRAO),
        );

        return $this->success(array_map(
            static fn (ItemTopMusicaArtistaDTO $item): array => $item->toArray(),
            $topMusicas,
        ));
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
