<?php

declare(strict_types=1);

namespace App\DataObject\Transcricao;

use App\Entity\Transcricao;

final readonly class PaginaTranscricoesDTO
{
    /**
     * @param list<Transcricao> $transcricoes
     */
    public function __construct(
        public array $transcricoes,
        public int $total,
    ) {}

    /**
     * @return list<Transcricao>
     */
    public function transcricoes(): array
    {
        return $this->transcricoes;
    }

    public function total(): int
    {
        return $this->total;
    }
}
