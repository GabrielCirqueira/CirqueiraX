<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\Entity\ReproducaoYoutube;
use App\Entity\Usuario;
use App\Repository\ReproducaoSpotifyRepository;
use App\Repository\ReproducaoYoutubeRepository;
use DateTimeImmutable;

final readonly class RecalcularTempoOuvidoYoutubeService
{
    private const int MINIMO_MS_SPOTIFY = 30000;
    private const string FOLGA_SPOTIFY = '+1 day';
    private const string FORMATO_MOMENTO = 'Y-m-d H:i:s';

    public function __construct(
        private ReproducaoYoutubeRepository $reproducaoRepository,
        private ReproducaoSpotifyRepository $reproducaoSpotifyRepository,
        private EstimarTempoReproduzidoYoutubeService $estimarTempo,
    ) {
    }

    public function calcularIntervalo(Usuario $usuario, DateTimeImmutable $inicio, DateTimeImmutable $fim, float $fatorFimDeSessao, bool $apenasTakeout, ?DateTimeImmutable $ignorarAPartirDe = null): int
    {
        $reproducoes = $this->reproducaoRepository->listarNoIntervalo($usuario, $inicio, $fim);
        $seguinteForaDoPeriodo = $this->reproducaoRepository->buscarPrimeiraAPartirDe($usuario, $fim);
        $iniciosSpotify = $this->reproducaoSpotifyRepository->listarIniciosNoIntervalo($usuario, $inicio, $fim->modify(self::FOLGA_SPOTIFY), self::MINIMO_MS_SPOTIFY);
        $limiteIgnorar = $ignorarAPartirDe?->format(self::FORMATO_MOMENTO);
        $posicaoSpotify = 0;
        $recalculadas = 0;

        foreach ($reproducoes as $indice => $reproducao) {
            $momento = $reproducao->tocadaEm()->format(self::FORMATO_MOMENTO);
            while (isset($iniciosSpotify[$posicaoSpotify]) && $iniciosSpotify[$posicaoSpotify] <= $momento) {
                ++$posicaoSpotify;
            }

            if (!$this->deveRecalcular($reproducao, $apenasTakeout, $momento, $limiteIgnorar)) {
                continue;
            }

            $seguinte = $reproducoes[$indice + 1] ?? $seguinteForaDoPeriodo;
            $this->estimarTempo->executar($reproducao, $seguinte, $fatorFimDeSessao, $iniciosSpotify[$posicaoSpotify] ?? null);
            ++$recalculadas;
        }

        return $recalculadas;
    }

    private function deveRecalcular(ReproducaoYoutube $reproducao, bool $apenasTakeout, string $momento, ?string $limiteIgnorar): bool
    {
        if ($reproducao->isTempoExato() || ($apenasTakeout && !$reproducao->fonte()->isTakeout())) {
            return false;
        }

        return null === $limiteIgnorar || $momento < $limiteIgnorar;
    }
}
