<?php

declare(strict_types=1);

namespace App\DataObject;

final readonly class AudioBaixadoDTO
{
    public function __construct(
        public string $caminhoArquivo,
        public int $tamanhoBytes,
        public ?string $titulo,
        public ?string $autor,
        public ?int $duracaoSegundos,
        public ?string $thumbnailUrl,
    ) {}

    public function caminhoArquivo(): string
    {
        return $this->caminhoArquivo;
    }

    public function tamanhoBytes(): int
    {
        return $this->tamanhoBytes;
    }

    public function titulo(): ?string
    {
        return $this->titulo;
    }

    public function autor(): ?string
    {
        return $this->autor;
    }

    public function duracaoSegundos(): ?int
    {
        return $this->duracaoSegundos;
    }

    public function thumbnailUrl(): ?string
    {
        return $this->thumbnailUrl;
    }
}
