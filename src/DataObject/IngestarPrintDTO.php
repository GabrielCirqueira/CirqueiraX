<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class IngestarPrintDTO
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        #[Assert\NotNull(message: 'O arquivo de print é obrigatório.')]
        #[Assert\File(
            maxSize: '20M',
            mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
            mimeTypesMessage: 'O arquivo enviado deve ser uma imagem válida (PNG, JPEG ou WebP).'
        )]
        public ?UploadedFile $arquivo,
        public ?string $nomeOriginal = null,
        public ?string $timestampCaptura = null,
        public array $metadata = [],
    ) {}

    public static function fromRequest(Request $request): self
    {
        /** @var UploadedFile|null $arquivo */
        $arquivo = $request->files->get('arquivo');
        $nomeOriginal = $request->request->get('nomeOriginal') ?? $request->request->get('nome_original');
        $timestampCaptura = $request->request->get('timestampCaptura') ?? $request->request->get('timestamp_captura');

        /** @var array<string, mixed> $metadata */
        $metadata = [];
        $metadataBruta = $request->request->all('metadata');
        if ([] !== $metadataBruta) {
            /** @var array<string, mixed> $metadataBruta */
            $metadata = $metadataBruta;
        } else {
            $metadataString = $request->request->get('metadata');
            if (is_string($metadataString) && '' !== trim($metadataString)) {
                /** @var mixed $decodificado */
                $decodificado = json_decode($metadataString, true);
                if (is_array($decodificado)) {
                    /** @var array<string, mixed> $decodificado */
                    $metadata = $decodificado;
                }
            }
        }

        return new self(
            arquivo: $arquivo,
            nomeOriginal: is_string($nomeOriginal) ? $nomeOriginal : $arquivo?->getClientOriginalName(),
            timestampCaptura: is_string($timestampCaptura) ? $timestampCaptura : null,
            metadata: $metadata,
        );
    }

    public function arquivo(): ?UploadedFile
    {
        return $this->arquivo;
    }

    public function nomeOriginal(): ?string
    {
        return $this->nomeOriginal;
    }

    public function timestampCaptura(): ?string
    {
        return $this->timestampCaptura;
    }

    /**
     * @return array<string, mixed>
     */
    public function metadata(): array
    {
        return $this->metadata;
    }
}
