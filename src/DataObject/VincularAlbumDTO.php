<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class VincularAlbumDTO
{
    public function __construct(
        #[Assert\NotBlank(message: 'O ID do álbum do Google Fotos é obrigatório.')]
        private string $googlePhotosAlbumId,
    ) {}

    public function googlePhotosAlbumId(): string
    {
        return $this->googlePhotosAlbumId;
    }
}
