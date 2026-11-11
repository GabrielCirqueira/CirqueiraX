<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\Entity\ReproducaoYoutube;

final readonly class EstimarTempoReproduzidoYoutubeService
{
    private const int MILISSEGUNDOS_POR_SEGUNDO = 1000;

    public function executar(ReproducaoYoutube $anterior, ReproducaoYoutube $seguinte): void
    {
        $intervaloMs = ($seguinte->tocadaEm()->getTimestamp() - $anterior->tocadaEm()->getTimestamp()) * self::MILISSEGUNDOS_POR_SEGUNDO;
        $duracaoMs = $anterior->video()->duracaoMs();

        if (null === $duracaoMs) {
            $anterior->ajustarMsReproduzidos(max(0, $intervaloMs));

            return;
        }

        $anterior->ajustarMsReproduzidos(max(0, min($intervaloMs, $duracaoMs)));
    }
}
