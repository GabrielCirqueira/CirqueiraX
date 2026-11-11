<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;

final readonly class UploadImportacaoYoutubeDTO
{
    private const string CAMPO_ARQUIVO = 'arquivo';

    public function __construct(
        public ?UploadedFile $arquivo,
    ) {
    }

    public static function fromRequest(Request $request): self
    {
        $arquivo = $request->files->get(self::CAMPO_ARQUIVO);

        return new self($arquivo instanceof UploadedFile ? $arquivo : null);
    }
}
