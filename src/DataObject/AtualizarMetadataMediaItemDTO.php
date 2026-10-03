<?php

declare(strict_types=1);

namespace App\DataObject;

use App\Support\MetadataKeys;

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
        public ?string $thumbnail = null,
        public array $metadata = [],
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        $dados = $this->metadata;
        if (null !== $this->titulo) {
            $dados[MetadataKeys::TITULO] = $this->titulo;
        }
        if (null !== $this->uploader) {
            $dados[MetadataKeys::UPLOADER] = $this->uploader;
        }
        if (null !== $this->data) {
            $dados[MetadataKeys::DATA] = $this->data;
        }
        if (null !== $this->duracao) {
            $dados[MetadataKeys::DURACAO] = $this->duracao;
        }
        if (null !== $this->thumbnail) {
            $dados[MetadataKeys::THUMBNAIL] = $this->thumbnail;
        }

        return $dados;
    }
}
