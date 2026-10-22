<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class SolicitarDownloadAudioDTO
{
    public function __construct(
        #[Assert\NotBlank(message: 'O link do áudio é obrigatório.')]
        #[Assert\Url(message: 'Informe um link válido.', requireTld: true)]
        #[Assert\Length(max: 1024, maxMessage: 'O link deve ter no máximo {{ limit }} caracteres.')]
        public string $url = '',
    ) {}

    public function url(): string
    {
        return trim($this->url);
    }
}
