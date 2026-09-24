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

    public function calcularHash(): string
    {
        if (!file_exists($this->caminhoArquivo) || !is_readable($this->caminhoArquivo)) {
            throw new \DomainException('arquivo_nao_encontrado', 404);
        }

        $hash = hash_file('sha256', $this->caminhoArquivo);
        if (false === $hash) {
            throw new \DomainException('falha_calcular_hash', 500);
        }

        return $hash;
    }
}
