<?php

declare(strict_types=1);

namespace App\Controller\Spotify;

use App\Controller\Common\DefaultController;
use App\DataObject\Spotify\ConcluirAutorizacaoSpotifyDTO;
use App\DataObject\Spotify\ConsultarImagensSpotifyDTO;
use App\DataObject\Spotify\UploadImportacaoSpotifyDTO;
use App\Entity\Usuario;
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
use App\Service\Spotify\ObterStatusSpotifyService;
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
        private readonly ImagemSpotifyRepository $imagemRepository,
        private readonly ContaSpotifySerializer $contaSpotifySerializer,
        private readonly ImportacaoSpotifySerializer $importacaoSpotifySerializer,
        private readonly SpotifyCapsulaSerializer $capsulaSerializer,
        private readonly SpotifyResumoSerializer $resumoSerializer,
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

    #[Route('/imagens/consultar', name: 'consultar_imagens', methods: ['POST'])]
    public function consultarImagens(
        #[CurrentUser] Usuario $usuario,
        #[MapRequestPayload] ConsultarImagensSpotifyDTO $dto,
    ): Response {
        $imagens = $this->imagemRepository->buscarMapeamentoPorChaves($dto->chaves);
        $resultado = [];

        foreach ($dto->chaves as $chave) {
            $imagem = $imagens[$chave] ?? null;
            $resultado[$chave] = [
                'chave' => $chave,
                'status' => $imagem?->status()->value ?? 'nao_cadastrada',
                'imagemUrl' => $imagem?->primeiraImagemUrl(),
                'urlSpotify' => $imagem?->urlSpotify(),
            ];
        }

        return $this->success($resultado);
    }
}
