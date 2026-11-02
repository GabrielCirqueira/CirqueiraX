<?php

declare(strict_types=1);

namespace App\DataObject;

final readonly class ResultadoSinteseVozDTO
{
    public function __construct(
        public string $caminhoAudio,
        public int $duracaoSegundos,
        public int $tamanhoBytes,
    ) {}

    public function caminhoAudio(): string
    {
        return $this->caminhoAudio;
    }

    public function duracaoSegundos(): int
    {
        return $this->duracaoSegundos;
    }

    public function tamanhoBytes(): int
    {
        return $this->tamanhoBytes;
    }
}
