<?php

declare(strict_types=1);

namespace App\DataObject;

final readonly class AtualizarMetadataMediaItemDTO
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        public ?string $titulo = null,
        public ?string $uploader = null,
        public ?string $data = null,
        public ?int $duracao = null,
        public array $metadata = [],
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        $dados = $this->metadata;
        if (null !== $this->titulo) {
            $dados['titulo'] = $this->titulo;
        }
        if (null !== $this->uploader) {
            $dados['uploader'] = $this->uploader;
        }
        if (null !== $this->data) {
            $dados['data'] = $this->data;
        }
        if (null !== $this->duracao) {
            $dados['duracao'] = $this->duracao;
        }

        return $dados;
    }
}
