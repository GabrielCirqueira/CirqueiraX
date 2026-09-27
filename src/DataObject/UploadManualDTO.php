<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class UploadManualDTO
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        #[Assert\NotNull(message: 'O arquivo para upload é obrigatório.')]
        #[Assert\File(
            maxSize: '100M',
            mimeTypes: [
                'image/png',
                'image/jpeg',
                'image/webp',
                'image/gif',
                'video/mp4',
                'video/webm',
                'video/quicktime',
                'video/x-msvideo',
                'video/mkv',
                'video/x-matroska',
            ],
            mimeTypesMessage: 'O arquivo enviado deve ser uma imagem (PNG, JPEG, WebP, GIF) ou vídeo (MP4, WebM, MOV, AVI, MKV) válido.'
        )]
        public ?UploadedFile $arquivo,
        public ?string $nomeOriginal = null,
        public ?string $categoriaId = null,
        public array $metadata = [],
    ) {
    }

    public static function fromRequest(Request $request): self
    {
        /** @var UploadedFile|null $arquivo */
        $arquivo = $request->files->get('arquivo');
        $nomeOriginal = $request->request->get('nomeOriginal') ?? $request->request->get('nome_original');
        $categoriaId = $request->request->get('categoriaId') ?? $request->request->get('categoria_id');

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
            categoriaId: is_string($categoriaId) && '' !== trim($categoriaId) ? $categoriaId : null,
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

    public function categoriaId(): ?string
    {
        return $this->categoriaId;
    }

    /**
     * @return array<string, mixed>
     */
    public function metadata(): array
    {
        return $this->metadata;
    }
}
