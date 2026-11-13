<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

final readonly class LinhaDoTempoMusicaDTO
{
    /**
     * @param list<MesLinhaDoTempoMusicaDTO> $meses
     */
    public function __construct(
        public array $meses,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'meses' => array_map(static fn (MesLinhaDoTempoMusicaDTO $mes): array => $mes->paraArray(), $this->meses),
        ];
    }
}
