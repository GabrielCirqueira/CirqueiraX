<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

use App\Entity\TokenExtensaoYoutubeMusic;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class GerarTokenExtensaoYoutubeDTO
{
    public function __construct(
        #[Assert\NotBlank(message: 'Dê um nome ao aparelho, por exemplo "PC de casa".')]
        #[Assert\Length(max: TokenExtensaoYoutubeMusic::TAMANHO_MAXIMO_NOME, maxMessage: 'Use no máximo {{ limit }} caracteres.')]
        public string $nomeAparelho = '',
    ) {
    }
}
