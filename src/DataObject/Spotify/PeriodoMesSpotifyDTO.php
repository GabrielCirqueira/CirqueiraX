<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class PeriodoMesSpotifyDTO
{
    public const string FUSO_HORARIO_PADRAO = 'America/Sao_Paulo';

    public function __construct(
        private int $ano,
        private int $mes,
        private \DateTimeImmutable $inicioUtc,
        private \DateTimeImmutable $fimUtc,
    ) {}

    public static function criar(int $ano, int $mes): self
    {
        $fuso = new \DateTimeZone(self::FUSO_HORARIO_PADRAO);
        $utc = new \DateTimeZone('UTC');

        $inicioLocal = new \DateTimeImmutable(sprintf('%04d-%02d-01 00:00:00', $ano, $mes), $fuso);
        $fimLocal = $inicioLocal->modify('+1 month');

        return new self(
            ano: $ano,
            mes: $mes,
            inicioUtc: $inicioLocal->setTimezone($utc),
            fimUtc: $fimLocal->setTimezone($utc),
        );
    }

    public static function criarDoMesmoAnoMes(\DateTimeImmutable $dataUtc): self
    {
        $fuso = new \DateTimeZone(self::FUSO_HORARIO_PADRAO);
        $dataLocal = $dataUtc->setTimezone($fuso);

        return self::criar(
            (int) $dataLocal->format('Y'),
            (int) $dataLocal->format('m'),
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
        $agoraLocal = (new \DateTimeImmutable())->setTimezone(new \DateTimeZone(self::FUSO_HORARIO_PADRAO));

        return (int) $agoraLocal->format('Y') === $this->ano && (int) $agoraLocal->format('m') === $this->mes;
    }
}

