<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

use SensitiveParameter;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class ConectarYoutubeMusicDTO
{
    public const int TAMANHO_MAXIMO_CABECALHOS = 32768;

    public function __construct(
        #[Assert\NotBlank(message: 'Cole os cabeçalhos copiados do navegador.')]
        #[Assert\Length(max: self::TAMANHO_MAXIMO_CABECALHOS, maxMessage: 'O texto colado é grande demais. Copie só os cabeçalhos de uma requisição.')]
        #[SensitiveParameter]
        public string $cabecalhos,
    ) {
    }
}
