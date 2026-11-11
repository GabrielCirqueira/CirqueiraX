<?php

declare(strict_types=1);

namespace App\Controller\Musica;

use App\Controller\Common\DefaultController;
use App\DataObject\Musica\FiltroFonteRequisicaoDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\Usuario;
use App\Service\IdentificacaoMusica\ObterConsumoIdentificacaoService;
use App\Service\IdentificacaoMusica\ObterResumoIdentificacaoService;
use App\Service\Musica\Analise\ObterDescobertasMusicaService;
use App\Service\Musica\Analise\ObterDetalheArtistaMusicaService;
use App\Service\Musica\Analise\ObterDetalheMusicaService;
use App\Service\Musica\Analise\ObterEvolucaoMensalMusicaService;
use App\Service\Musica\Analise\ObterHabitosMusicaService;
use App\Service\Musica\Analise\ObterRecordesMusicaService;
use App\Service\Musica\Analise\ObterRetrospectivaAnualMusicaService;
use App\Service\Musica\Analise\ResolverAlvoPorNomeService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

final class MusicaAnaliseController extends DefaultController
{
    private const string PREFIXO = '/api/v1/musica';
    private const string PREFIXO_ALIAS = '/api/v1/spotify';
    private const array PADRAO_ALIAS = [FiltroFonteRequisicaoDTO::PARAMETRO => 'spotify'];

    public function __construct(
        private readonly ObterDetalheArtistaMusicaService $obterDetalheArtistaService,
        private readonly ObterDetalheMusicaService $obterDetalheMusicaService,
        private readonly ObterHabitosMusicaService $obterHabitosService,
        private readonly ObterRecordesMusicaService $obterRecordesService,
        private readonly ObterEvolucaoMensalMusicaService $obterEvolucaoMensalService,
        private readonly ObterDescobertasMusicaService $obterDescobertasService,
        private readonly ObterRetrospectivaAnualMusicaService $obterRetrospectivaService,
        private readonly ResolverAlvoPorNomeService $resolverAlvoService,
        private readonly ObterResumoIdentificacaoService $obterResumoIdentificacaoService,
        private readonly ObterConsumoIdentificacaoService $obterConsumoIdentificacaoService,
    ) {}

    #[Route(self::PREFIXO.'/artistas/{uuid}', name: 'api_musica_detalhe_artista', requirements: ['uuid' => '[0-9a-fA-F-]{36}'], methods: ['GET'])]
    public function detalheArtista(string $uuid, Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->obterDetalheArtistaService->executar($usuario, FiltroFonteRequisicaoDTO::daRequisicao($request), $uuid)->paraArray());
    }

    #[Route(self::PREFIXO_ALIAS.'/artistas/detalhe', name: 'api_spotify_analise_detalhe_artista', defaults: self::PADRAO_ALIAS, methods: ['GET'])]
    public function detalheArtistaPorNome(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $artista = trim((string) $request->query->get('artista', ''));
        if ('' === $artista) {
            return $this->error('Informe o artista.');
        }

        return $this->detalheArtista($this->resolverAlvoService->resolverArtista($usuario, $artista), $request, $usuario);
    }

    #[Route(self::PREFIXO.'/musicas/{uuid}', name: 'api_musica_detalhe_musica', requirements: ['uuid' => '[0-9a-fA-F-]{36}'], methods: ['GET'])]
    public function detalheMusica(string $uuid, Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->obterDetalheMusicaService->executar($usuario, FiltroFonteRequisicaoDTO::daRequisicao($request), $uuid)->paraArray());
    }

    #[Route(self::PREFIXO_ALIAS.'/musicas/detalhe', name: 'api_spotify_analise_detalhe_musica', defaults: self::PADRAO_ALIAS, methods: ['GET'])]
    public function detalheMusicaPorNome(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $nome = trim((string) $request->query->get('nome', ''));
        $artista = trim((string) $request->query->get('artista', ''));
        if ('' === $nome || '' === $artista) {
            return $this->error('Informe a música e o artista.');
        }

        return $this->detalheMusica($this->resolverAlvoService->resolverMusica($usuario, $nome, $artista), $request, $usuario);
    }

    #[Route(self::PREFIXO.'/habitos', name: 'api_musica_habitos', methods: ['GET'])]
    #[Route(self::PREFIXO_ALIAS.'/habitos', name: 'api_spotify_analise_habitos', defaults: self::PADRAO_ALIAS, methods: ['GET'])]
    public function habitos(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $periodo = PeriodoAnaliseSpotifyDTO::fromRequest($request);

        return $this->success($this->obterHabitosService->executar($usuario, FiltroFonteRequisicaoDTO::daRequisicao($request), $periodo)->paraArray());
    }

    #[Route(self::PREFIXO.'/recordes', name: 'api_musica_recordes', methods: ['GET'])]
    #[Route(self::PREFIXO_ALIAS.'/recordes', name: 'api_spotify_analise_recordes', defaults: self::PADRAO_ALIAS, methods: ['GET'])]
    public function recordes(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->obterRecordesService->executar($usuario, FiltroFonteRequisicaoDTO::daRequisicao($request))->paraArray());
    }

    #[Route(self::PREFIXO.'/evolucao', name: 'api_musica_evolucao', methods: ['GET'])]
    #[Route(self::PREFIXO_ALIAS.'/evolucao', name: 'api_spotify_analise_evolucao', defaults: self::PADRAO_ALIAS, methods: ['GET'])]
    public function evolucao(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $meses = $request->query->has('meses') ? $request->query->getInt('meses') : null;

        return $this->success($this->obterEvolucaoMensalService->executar($usuario, FiltroFonteRequisicaoDTO::daRequisicao($request), $meses)->paraArray());
    }

    #[Route(self::PREFIXO.'/descobertas', name: 'api_musica_descobertas', methods: ['GET'])]
    #[Route(self::PREFIXO_ALIAS.'/descobertas', name: 'api_spotify_analise_descobertas', defaults: self::PADRAO_ALIAS, methods: ['GET'])]
    public function descobertas(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $periodo = PeriodoAnaliseSpotifyDTO::fromRequest($request);

        return $this->success($this->obterDescobertasService->executar($usuario, FiltroFonteRequisicaoDTO::daRequisicao($request), $periodo)->paraArray());
    }

    #[Route(self::PREFIXO.'/retrospectiva/{ano<\d{4}>}', name: 'api_musica_retrospectiva', methods: ['GET'])]
    #[Route(self::PREFIXO_ALIAS.'/retrospectiva/{ano<\d{4}>}', name: 'api_spotify_analise_retrospectiva', defaults: self::PADRAO_ALIAS, methods: ['GET'])]
    public function retrospectiva(int $ano, Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->obterRetrospectivaService->executar($usuario, FiltroFonteRequisicaoDTO::daRequisicao($request), $ano)->paraArray());
    }

    #[Route(self::PREFIXO.'/identificacao/resumo', name: 'api_musica_identificacao_resumo', methods: ['GET'])]
    public function resumoIdentificacao(#[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->obterResumoIdentificacaoService->executar($usuario));
    }

    #[Route(self::PREFIXO.'/identificacao/consumo', name: 'api_musica_identificacao_consumo', methods: ['GET'])]
    public function consumoIdentificacao(Request $request, #[CurrentUser] Usuario $usuario): Response
    {
        $dias = $request->query->has('dias') ? $request->query->getInt('dias') : null;

        return $this->success($this->obterConsumoIdentificacaoService->executar($usuario, $dias));
    }
}
