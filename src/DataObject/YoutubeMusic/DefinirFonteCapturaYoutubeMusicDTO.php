<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

use App\Enum\FonteCapturaYoutubeMusic;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class DefinirFonteCapturaYoutubeMusicDTO
{
    public function __construct(
        #[Assert\NotBlank(message: 'Escolha a fonte ativa.')]
        #[Assert\Choice(callback: [self::class, 'fontesAceitas'], message: 'Fonte inválida.')]
        public string $fonte = '',
    ) {
    }

    /**
     * @return list<string>
     */
    public static function fontesAceitas(): array
    {
        return array_map(static fn (FonteCapturaYoutubeMusic $fonte): string => $fonte->value, FonteCapturaYoutubeMusic::cases());
    }

    public function fonteEscolhida(): FonteCapturaYoutubeMusic
    {
        return FonteCapturaYoutubeMusic::from($this->fonte);
    }
}
