<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class PeriodoMesSpotifyDTO
{
    public const string FUSO_HORARIO_PADRAO = 'America/Sao_Paulo';
    public const string FUSO_CALENDARIO_SPOTIFY = 'UTC';

    public function __construct(
        private int $ano,
        private int $mes,
        private \DateTimeImmutable $inicioUtc,
        private \DateTimeImmutable $fimUtc,
    ) {}

    public static function criar(int $ano, int $mes): self
    {
        $inicioUtc = new \DateTimeImmutable(
            sprintf('%04d-%02d-01 00:00:00', $ano, $mes),
            new \DateTimeZone(self::FUSO_CALENDARIO_SPOTIFY),
        );

        return new self(
            ano: $ano,
            mes: $mes,
            inicioUtc: $inicioUtc,
            fimUtc: $inicioUtc->modify('+1 month'),
        );
    }

    public static function criarDoMesmoAnoMes(\DateTimeImmutable $dataUtc): self
    {
        $dataCalendario = $dataUtc->setTimezone(new \DateTimeZone(self::FUSO_CALENDARIO_SPOTIFY));

        return self::criar(
            (int) $dataCalendario->format('Y'),
            (int) $dataCalendario->format('m'),
        );
    }

    public function ano(): int
    {
        return $this->ano;
    }

    public function mes(): int
    {
        return $this->mes;
    }

    public function inicioUtc(): \DateTimeImmutable
    {
        return $this->inicioUtc;
    }

    public function fimUtc(): \DateTimeImmutable
    {
        return $this->fimUtc;
    }

    public function mesAnterior(): self
    {
        $ano = $this->ano;
        $mes = $this->mes - 1;

        if ($mes < 1) {
            $mes = 12;
            $ano--;
        }

        return self::criar($ano, $mes);
    }

    public function isMesCorrente(): bool
    {
        $agora = self::agoraCalendario();

        return (int) $agora->format('Y') === $this->ano && (int) $agora->format('m') === $this->mes;
    }

    public static function agoraCalendario(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('now', new \DateTimeZone(self::FUSO_CALENDARIO_SPOTIFY));
    }
}

