<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

final readonly class SequenciasSpotifyDTO
{
    public function __construct(
        public int $atual,
        public ?string $inicioAtual,
        public int $maior,
        public ?string $inicioMaior,
        public ?string $fimMaior,
        public bool $ouviuHoje,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'atual' => $this->atual,
            'inicioAtual' => $this->inicioAtual,
            'maior' => $this->maior,
            'inicioMaior' => $this->inicioMaior,
            'fimMaior' => $this->fimMaior,
            'ouviuHoje' => $this->ouviuHoje,
        ];
    }
}
