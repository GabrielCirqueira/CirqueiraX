<?php

declare(strict_types=1);

namespace App\DataObject\Transcricao;

use App\Enum\IdiomaTranscricao;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class EnviarAudioTranscricaoDTO
{
    public function __construct(
        #[Assert\NotNull(message: 'Envie um arquivo de áudio ou vídeo para transcrever.')]
        #[Assert\File(
            maxSize: 2147483648,
            mimeTypes: ['audio/*', 'video/*', 'application/ogg'],
            maxSizeMessage: 'O arquivo passa do limite de 2 GB.',
            mimeTypesMessage: 'O arquivo enviado precisa ser um áudio ou vídeo.'
        )]
        public ?UploadedFile $arquivo,
        public IdiomaTranscricao $idioma = IdiomaTranscricao::AUTOMATICO,
    ) {}

    public static function fromRequest(Request $request): self
    {
        /** @var UploadedFile|null $arquivo */
        $arquivo = $request->files->get('arquivo');
        $idioma = IdiomaTranscricao::tryFrom((string) $request->request->get('idioma', ''));

        return new self(
            arquivo: $arquivo,
            idioma: $idioma ?? IdiomaTranscricao::AUTOMATICO,
        );
    }

    public function arquivo(): ?UploadedFile
    {
        return $this->arquivo;
    }

    public function idioma(): IdiomaTranscricao
    {
        return $this->idioma;
    }
}
