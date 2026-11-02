<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class UploadLivroAudioDTO
{
    public function __construct(
        #[Assert\NotNull(message: 'O arquivo PDF para upload é obrigatório.')]
        #[Assert\File(
            maxSize: '500M',
            mimeTypes: [
                'application/pdf',
                'application/x-pdf',
            ],
            mimeTypesMessage: 'O arquivo enviado deve ser um documento PDF válido.'
        )]
        public ?UploadedFile $arquivo,
        public ?string $titulo = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        /** @var UploadedFile|null $arquivo */
        $arquivo = $request->files->get('arquivo') ?? $request->files->get('pdf');
        $titulo = $request->request->get('titulo');

        return new self(
            arquivo: $arquivo,
            titulo: is_string($titulo) && '' !== trim($titulo) ? trim($titulo) : null,
        );
    }

    public function arquivo(): ?UploadedFile
    {
        return $this->arquivo;
    }

    public function titulo(): ?string
    {
        return $this->titulo;
    }
}
