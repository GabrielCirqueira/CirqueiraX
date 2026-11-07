<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\Analise\SequenciasSpotifyDTO;
use DateTimeImmutable;

final readonly class CalcularSequenciasSpotifyService
{
    private const string FORMATO_DIA = 'Y-m-d';

    /**
     * @param list<string> $diasOrdenados
     */
    public function calcular(array $diasOrdenados, DateTimeImmutable $hojeLocal): SequenciasSpotifyDTO
    {
        if ([] === $diasOrdenados) {
            return new SequenciasSpotifyDTO(0, null, 0, null, null, false);
        }

        $maior = 0;
        $inicioMaior = null;
        $fimMaior = null;
        $tamanhoAtual = 0;
        $inicioAtual = null;
        $diaAnterior = null;

        foreach ($diasOrdenados as $dia) {
            $continua = null !== $diaAnterior && $this->diaSeguinte($diaAnterior) === $dia;
            $tamanhoAtual = $continua ? $tamanhoAtual + 1 : 1;
            $inicioAtual = $continua ? $inicioAtual : $dia;

            if ($tamanhoAtual > $maior) {
                $maior = $tamanhoAtual;
                $inicioMaior = $inicioAtual;
                $fimMaior = $dia;
            }

            $diaAnterior = $dia;
        }

        $hoje = $hojeLocal->format(self::FORMATO_DIA);
        $ontem = $hojeLocal->modify('-1 day')->format(self::FORMATO_DIA);
        $sequenciaViva = $diaAnterior === $hoje || $diaAnterior === $ontem;

        return new SequenciasSpotifyDTO(
            $sequenciaViva ? $tamanhoAtual : 0,
            $sequenciaViva ? $inicioAtual : null,
            $maior,
            $inicioMaior,
            $fimMaior,
            $diaAnterior === $hoje,
        );
    }

    private function diaSeguinte(string $dia): string
    {
        return (new DateTimeImmutable($dia))->modify('+1 day')->format(self::FORMATO_DIA);
    }
}
