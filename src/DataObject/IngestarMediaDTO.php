<?php

declare(strict_types=1);

namespace App\DataObject;

use App\Enum\OrigemMedia;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class IngestarMediaDTO
{
    public OrigemMedia $origem;

    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        #[Assert\NotBlank(message: 'O caminho do arquivo é obrigatório.')]
        public string $caminhoArquivo,
        OrigemMedia|string $origem,
        public array $metadata = [],
        public ?string $hash = null,
    ) {
        $this->origem = is_string($origem) ? (OrigemMedia::tryFrom($origem) ?? OrigemMedia::MANUAL) : $origem;
    }

    public function caminhoArquivo(): string
    {
        return $this->caminhoArquivo;
    }

    public function origem(): OrigemMedia
    {
        return $this->origem;
    }

    /**
     * @return array<string, mixed>
     */
    public function metadata(): array
    {
        return $this->metadata;
    }

    public function hash(): ?string
    {
        return $this->hash;
    }
}
