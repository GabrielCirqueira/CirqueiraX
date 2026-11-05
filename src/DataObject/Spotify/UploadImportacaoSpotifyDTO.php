<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class UploadImportacaoSpotifyDTO
{
    public function __construct(
        #[Assert\NotNull(message: 'O arquivo de histórico para importação é obrigatório.')]
        #[Assert\File(
            maxSize: '100M',
            maxSizeMessage: 'O arquivo enviado ultrapassa o tamanho máximo de 100 MB.'
        )]
        public ?UploadedFile $arquivo,
    ) {}

    public static function fromRequest(Request $request): self
    {
        /** @var UploadedFile|null $arquivo */
        $arquivo = $request->files->get('arquivo') ?? $request->files->get('file');

        return new self(
            arquivo: $arquivo,
        );
    }

    public function arquivo(): ?UploadedFile
    {
        return $this->arquivo;
    }
}
