<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Entity\ImportacaoYoutube;
use App\Enum\FonteReproducaoYoutube;
use App\Enum\StatusClassificacaoVideo;
use App\Repository\ReproducaoYoutubeRepository;

final readonly class GerarRelatorioImportacaoYoutubeService
{
    public function __construct(
        private ReproducaoYoutubeRepository $reproducaoRepository,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function executar(ImportacaoYoutube $importacao): array
    {
        $primeira = $importacao->primeiraReproducaoEm();
        $ultima = $importacao->ultimaReproducaoEm();
        $resumo = null === $primeira || null === $ultima
            ? ['videosPorStatus' => [], 'videosUnicos' => 0, 'mesesComDados' => 0]
            : $this->reproducaoRepository->resumirDaFonteNoIntervalo($importacao->usuario(), FonteReproducaoYoutube::Takeout, $primeira, $ultima);
        $porStatus = $resumo['videosPorStatus'];

        return [
            'reproducoesLidas' => $importacao->totalLidos(),
            'videosUnicos' => $resumo['videosUnicos'],
            'musicas' => $porStatus[StatusClassificacaoVideo::Musica->value] ?? 0,
            'mashups' => $porStatus[StatusClassificacaoVideo::Mashup->value] ?? 0,
            'compilacoes' => $porStatus[StatusClassificacaoVideo::Compilacao->value] ?? 0,
            'naoMusica' => $porStatus[StatusClassificacaoVideo::NaoMusica->value] ?? 0,
            'revisar' => $porStatus[StatusClassificacaoVideo::Revisar->value] ?? 0,
            'indisponiveis' => $porStatus[StatusClassificacaoVideo::Indisponivel->value] ?? 0,
            'pendentes' => $porStatus[StatusClassificacaoVideo::Pendente->value] ?? 0,
            'mesesComDados' => $resumo['mesesComDados'],
            'tokensEstimados' => $importacao->tokensEntradaEstimados() + $importacao->tokensSaidaEstimados(),
            'tokensReais' => $importacao->tokensEntradaReais() + $importacao->tokensSaidaReais(),
            'custoEstimadoMicrodolares' => $importacao->custoEstimadoMicrodolares(),
            'custoRealMicrodolares' => $importacao->custoRealMicrodolares(),
        ];
    }
}
