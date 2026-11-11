<?php

declare(strict_types=1);

namespace App\Controller\Musica;

use App\Controller\Common\DefaultController;
use App\DataObject\Musica\FiltroFonteRequisicaoDTO;
use App\DataObject\Spotify\ItemTopMusicaArtistaDTO;
use App\Entity\Usuario;
use App\Serializer\SpotifyCapsulaSerializer;
use App\Serializer\SpotifyResumoSerializer;
use App\Service\Musica\Analise\ListarMesesCapsulaService;
use App\Service\Musica\Analise\ObterDetalheCapsulaService;
use App\Service\Musica\Analise\ObterResumoHojeSemanaCuriosidadesService;
use App\Service\Musica\Analise\ObterResumoIntervaloPersonalizadoService;
use App\Service\Musica\Analise\ObterTopMusicasArtistaService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

final class MusicaController extends DefaultController
{
    private const string PREFIXO = '/api/v1/musica';
    private const int LIMITE_RANKING_PADRAO = 50;
    private const string TIPO_PADRAO = 'dias';

    public function __construct(
        private readonly ListarMesesCapsulaService $listarMesesCapsulaService,
        private readonly ObterDetalheCapsulaService $obterDetalheCapsulaService,
        private readonly ObterResumoHojeSemanaCuriosidadesService $obterResumoService,
        private readonly ObterResumoIntervaloPersonalizadoService $obterResumoIntervaloService,
        private readonly ObterTopMusicasArtistaService $obterTopMusicasArtistaService,
        private readonly SpotifyCapsulaSerializer $capsulaSerializer,
        private readonly SpotifyResumoSerializer $resumoSerializer,
    ) {}

    #[Route(self::PREFIXO.'/capsula', name: 'api_musica_listar_capsulas', methods: ['GET'])]
    public function listarCapsulas(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $meses = $this->listarMesesCapsulaService->executar($usuario, FiltroFonteRequisicaoDTO::daRequisicao($request));

        return $this->success($this->capsulaSerializer->serializarListaMeses($meses));
    }

    #[Route(self::PREFIXO.'/capsula/{ano<\d{4}>}/{mes<\d{1,2}>}', name: 'api_musica_obter_capsula', methods: ['GET'])]
    public function obterCapsula(int $ano, int $mes, Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $detalhe = $this->obterDetalheCapsulaService->executar($usuario, FiltroFonteRequisicaoDTO::daRequisicao($request), $ano, $mes);

        return $this->success($this->capsulaSerializer->serializarCapsula($detalhe->capsula(), $detalhe->mapaImagens()));
    }

    #[Route(self::PREFIXO.'/resumo', name: 'api_musica_obter_resumo', methods: ['GET'])]
    public function obterResumo(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $resumo = $this->obterResumoService->executar($usuario, FiltroFonteRequisicaoDTO::daRequisicao($request));

        return $this->success($this->resumoSerializer->serializarResumo($resumo->resumo(), $resumo->mapaImagens()));
    }

    #[Route(self::PREFIXO.'/ranking', name: 'api_musica_obter_ranking_intervalo', methods: ['GET'])]
    public function obterRankingIntervalo(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $resultado = $this->obterResumoIntervaloService->executar(
            usuario: $usuario,
            fonte: FiltroFonteRequisicaoDTO::daRequisicao($request),
            tipo: (string) $request->query->get('tipo', self::TIPO_PADRAO),
            dias: $this->inteiroOpcional($request, 'dias'),
            ano: $this->inteiroOpcional($request, 'ano'),
            mes: $this->inteiroOpcional($request, 'mes'),
            inicio: $this->textoOpcional($request, 'inicio'),
            fim: $this->textoOpcional($request, 'fim'),
            limite: $request->query->getInt('limite', self::LIMITE_RANKING_PADRAO),
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

    #[Route(self::PREFIXO.'/artistas/{uuid}/top-musicas', name: 'api_musica_obter_top_musicas_artista', methods: ['GET'])]
    public function obterTopMusicasArtista(string $uuid, Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        return $this->responderTopMusicas($uuid, $request, $usuario);
    }

    private function responderTopMusicas(string $artistaUuid, Request $request, Usuario $usuario): Response
    {
        $topMusicas = $this->obterTopMusicasArtistaService->executar(
            usuario: $usuario,
            fonte: FiltroFonteRequisicaoDTO::daRequisicao($request),
            artistaUuid: $artistaUuid,
            album: $this->textoOpcional($request, 'album'),
            tipo: $this->textoOpcional($request, 'tipo'),
            dias: $this->inteiroOpcional($request, 'dias'),
            ano: $this->inteiroOpcional($request, 'ano'),
            mes: $this->inteiroOpcional($request, 'mes'),
            inicio: $this->textoOpcional($request, 'inicio'),
            fim: $this->textoOpcional($request, 'fim'),
            limite: $request->query->getInt('limite', ObterTopMusicasArtistaService::LIMITE_PADRAO),
        );

        return $this->success(array_map(static fn (ItemTopMusicaArtistaDTO $item): array => $item->toArray(), $topMusicas));
    }

    private function inteiroOpcional(Request $request, string $nome): ?int
    {
        return $request->query->has($nome) ? $request->query->getInt($nome) : null;
    }

    private function textoOpcional(Request $request, string $nome): ?string
    {
        return $request->query->has($nome) ? (string) $request->query->get($nome) : null;
    }
}
