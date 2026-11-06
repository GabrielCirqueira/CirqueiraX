<?php

declare(strict_types=1);

namespace App\DataObject\Transcricao;

use App\Enum\IdiomaTranscricao;

final readonly class ReprocessarTranscricaoDTO
{
    public function __construct(
        public ?IdiomaTranscricao $idioma = null,
    ) {}

    public function idioma(): ?IdiomaTranscricao
    {
        return $this->idioma;
    }
}
