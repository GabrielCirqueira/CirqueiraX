<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use DateTimeImmutable;
use DateTimeInterface;

final readonly class ItemHistoricoRecenteDTO
{
    /**
     * @param list<string> $artistas
     */
    public function __construct(
        public string $titulo,
        public array $artistas,
        public ?string $urlCapa,
        public ?string $urlExterna,
        public DateTimeImmutable $tocadaEm,
        public string $fonte,
        public ?string $album = null,
        public ?string $codigoFaixa = null,
        public ?string $videoId = null,
        public bool $identificada = true,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'titulo' => $this->titulo,
            'artistas' => $this->artistas,
            'album' => $this->album,
            'urlCapa' => $this->urlCapa,
            'urlExterna' => $this->urlExterna,
            'tocadaEm' => $this->tocadaEm->format(DateTimeInterface::ATOM),
            'fonte' => $this->fonte,
            'codigoFaixa' => $this->codigoFaixa,
            'videoId' => $this->videoId,
            'identificada' => $this->identificada,
        ];
    }
}
