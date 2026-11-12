<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class LoteEventosExtensaoYoutubeDTO
{
    public const int MAXIMO_EVENTOS = 50;

    /**
     * @param list<EventoExtensaoYoutubeDTO> $eventos
     */
    public function __construct(
        #[Assert\Count(max: self::MAXIMO_EVENTOS, maxMessage: 'Envie no máximo {{ limit }} eventos por vez.')]
        #[Assert\Valid]
        public array $eventos = [],
    ) {
    }
}
