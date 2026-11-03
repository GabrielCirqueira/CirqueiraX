<?php

declare(strict_types=1);

namespace App\DataObject;

final readonly class ResultadoSinteseVozDTO
{
    /**
     * @param list<TrechoNarracaoDTO> $trechos
     */
    public function __construct(
        public string $caminhoAudio,
        public int $duracaoSegundos,
        public int $tamanhoBytes,
        public array $trechos = [],
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

    /**
     * @return list<TrechoNarracaoDTO>
     */
    public function trechos(): array
    {
        return $this->trechos;
    }
}
