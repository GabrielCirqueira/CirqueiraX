<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use App\DataObject\Spotify\TocandoAgoraSpotifyDTO;

final readonly class TocandoAgoraPronunciaDTO
{
    public function __construct(
        public bool $conectado,
        public TocandoAgoraSpotifyDTO $tocando,
        public int $proximaConsultaMs,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return ['conectado' => $this->conectado, 'proximaConsultaMs' => $this->proximaConsultaMs, ...$this->tocando->paraArray()];
    }
}
