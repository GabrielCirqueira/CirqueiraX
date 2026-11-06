<?php

declare(strict_types=1);

namespace App\Service\Spotify;

final readonly class EstimarTempoReproduzidoSpotifyService
{
    public function estimar(
        int $duracaoMs,
        ?\DateTimeImmutable $fimReproducaoAnterior,
        \DateTimeImmutable $fimReproducaoAtual,
    ): int {
        if ($duracaoMs <= 0) {
            return 0;
        }

        if (null === $fimReproducaoAnterior) {
            return $duracaoMs;
        }

        $intervaloMs = (int) round(
            ((float) $fimReproducaoAtual->format('U.u') - (float) $fimReproducaoAnterior->format('U.u')) * 1000
        );

        if ($intervaloMs <= 0) {
            return $duracaoMs;
        }

        return min($duracaoMs, $intervaloMs);
    }
}
