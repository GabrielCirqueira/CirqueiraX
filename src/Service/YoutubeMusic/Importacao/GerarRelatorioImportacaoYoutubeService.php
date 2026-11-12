<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Entity\ImportacaoYoutube;
use App\Enum\OrigemClassificacao;
use App\Enum\StatusClassificacaoVideo;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Repository\ReproducaoYoutubeRepository;

final readonly class GerarRelatorioImportacaoYoutubeService
{
    public const int LIMITE_TOPS = 5;
    private const int MS_POR_MINUTO = 60000;
    private const array STATUS_MUSICA = [StatusClassificacaoVideo::Musica, StatusClassificacaoVideo::Mashup];

    public function __construct(
        private ReproducaoYoutubeRepository $reproducaoRepository,
        private AnaliseReproducaoMusicalRepository $analiseRepository,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function executar(ImportacaoYoutube $importacao): array
    {
        $resumo = $this->reproducaoRepository->resumirDaImportacao($importacao, AnaliseReproducaoMusicalRepository::CORTE_STREAM_MS);
        $musicas = $this->analiseRepository->resumirMusicasDaImportacao($importacao->usuario(), $importacao->uuid(), self::LIMITE_TOPS);
        $porStatus = $resumo['porStatus'];
        $porOrigem = $resumo['porOrigem'];
        $videos = static fn (StatusClassificacaoVideo $status): int => $porStatus[$status->value]['videos'] ?? 0;
        $somarMusica = static fn (string $campo): int => array_sum(array_map(static fn (StatusClassificacaoVideo $status): int => $porStatus[$status->value][$campo] ?? 0, self::STATUS_MUSICA));

        return [
            'reproducoesLidas' => $importacao->totalLidos(),
            'reproducoesNovas' => $importacao->totalNovos(),
            'reproducoesJaExistiam' => $importacao->totalIgnorados(),
            'reproducoesUnificadas' => $importacao->totalUnificados(),
            'reproducoesDescartadas' => $importacao->totalDescartados(),
            'videosUnicos' => $resumo['videosUnicos'],
            'videosNovos' => $importacao->totalVideosNovos(),
            'musicas' => $videos(StatusClassificacaoVideo::Musica),
            'mashups' => $videos(StatusClassificacaoVideo::Mashup),
            'compilacoes' => $videos(StatusClassificacaoVideo::Compilacao),
            'naoMusica' => $videos(StatusClassificacaoVideo::NaoMusica),
            'revisar' => $videos(StatusClassificacaoVideo::Revisar),
            'indisponiveis' => $videos(StatusClassificacaoVideo::Indisponivel),
            'pendentes' => $videos(StatusClassificacaoVideo::Pendente),
            'identificadasPorRegra' => ($porOrigem[OrigemClassificacao::Regra->value] ?? 0) + ($porOrigem[OrigemClassificacao::RegraCanal->value] ?? 0),
            'identificadasPelaIa' => $porOrigem[OrigemClassificacao::Ia->value] ?? 0,
            'identificadasPorVoce' => $porOrigem[OrigemClassificacao::Manual->value] ?? 0,
            'reproducoesDeMusica' => $somarMusica('reproducoes'),
            'streamsDeMusica' => $somarMusica('streams'),
            'minutosDeMusica' => (int) round($somarMusica('ms') / self::MS_POR_MINUTO),
            'musicasDistintas' => $musicas['totalMusicas'],
            'artistasDistintos' => $musicas['totalArtistas'],
            'topMusicas' => $musicas['musicas'],
            'topArtistas' => $musicas['artistas'],
            'mesesComDados' => $resumo['mesesComDados'],
            'tokensEstimados' => $importacao->tokensEntradaEstimados() + $importacao->tokensSaidaEstimados(),
            'tokensReais' => $importacao->tokensEntradaReais() + $importacao->tokensSaidaReais(),
            'custoEstimadoMicrodolares' => $importacao->custoEstimadoMicrodolares(),
            'custoRealMicrodolares' => $importacao->custoRealMicrodolares(),
        ];
    }
}
