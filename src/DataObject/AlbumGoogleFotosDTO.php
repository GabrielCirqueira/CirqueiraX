<?php

declare(strict_types=1);

namespace App\DataObject;

final readonly class AlbumGoogleFotosDTO
{
    public function __construct(
        public string $id,
        public string $titulo,
        public ?string $urlCapa = null,
        public int $totalItens = 0,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'urlCapa' => $this->urlCapa,
            'totalItens' => $this->totalItens,
        ];
    }
}
