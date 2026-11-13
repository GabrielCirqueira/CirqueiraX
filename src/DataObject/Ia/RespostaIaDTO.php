<?php

declare(strict_types=1);

namespace App\DataObject\Ia;

use App\Enum\ProvedorIa;

final readonly class RespostaIaDTO
{
    /**
     * @param array<string, mixed>|null $json
     */
    public function __construct(
        public ProvedorIa $provedor,
        public string $modelo,
        public string $texto,
        public int $tokensEntrada,
        public int $tokensSaida,
        public int $custoMicrodolares,
        public ?array $json = null,
    ) {
    }

    /**
     * @param array<string, mixed> $json
     */
    public function comJson(array $json): self
    {
        return new self($this->provedor, $this->modelo, $this->texto, $this->tokensEntrada, $this->tokensSaida, $this->custoMicrodolares, $json);
    }
}
