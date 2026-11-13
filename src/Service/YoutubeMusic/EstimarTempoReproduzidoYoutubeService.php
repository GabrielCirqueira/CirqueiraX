<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\Entity\ReproducaoYoutube;

final readonly class EstimarTempoReproduzidoYoutubeService
{
    private const int MILISSEGUNDOS_POR_SEGUNDO = 1000;
    private const int MS_SEM_DURACAO = 0;
    private const string FORMATO_MOMENTO = 'Y-m-d H:i:s';

    public function executar(ReproducaoYoutube $anterior, ?ReproducaoYoutube $seguinte, float $fatorFimDeSessao, ?string $inicioSpotifySeguinte = null): void
    {
        if ($anterior->isTempoExato()) {
            return;
        }

        $duracaoMs = $anterior->video()->duracaoMs();
        if (null === $duracaoMs) {
            $anterior->ajustarMsReproduzidos(self::MS_SEM_DURACAO);

            return;
        }

        $intervaloMs = $this->intervaloAteInterrupcaoMs($anterior, $seguinte, $inicioSpotifySeguinte);
        if (null === $intervaloMs || $intervaloMs > $duracaoMs + CalcularFatorFimDeSessaoYoutubeService::LIMITE_SESSAO_SEGUNDOS * self::MILISSEGUNDOS_POR_SEGUNDO) {
            $anterior->ajustarMsReproduzidos((int) round($duracaoMs * $fatorFimDeSessao));

            return;
        }

        $anterior->ajustarMsReproduzidos(max(0, min($intervaloMs, $duracaoMs)));
    }

    private function intervaloAteInterrupcaoMs(ReproducaoYoutube $anterior, ?ReproducaoYoutube $seguinte, ?string $inicioSpotifySeguinte): ?int
    {
        $inicio = strtotime($anterior->tocadaEm()->format(self::FORMATO_MOMENTO));
        $candidatos = [];
        if (null !== $seguinte) {
            $candidatos[] = strtotime($seguinte->tocadaEm()->format(self::FORMATO_MOMENTO));
        }
        if (null !== $inicioSpotifySeguinte) {
            $candidatos[] = strtotime($inicioSpotifySeguinte);
        }

        $candidatos = array_filter($candidatos, static fn (int|false $momento): bool => false !== $momento);
        if (false === $inicio || [] === $candidatos) {
            return null;
        }

        return max(0, min($candidatos) - $inicio) * self::MILISSEGUNDOS_POR_SEGUNDO;
    }
}
