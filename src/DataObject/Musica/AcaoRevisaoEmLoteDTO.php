<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use App\Enum\AcaoRevisaoVideo;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class AcaoRevisaoEmLoteDTO
{
    public const int LIMITE_VIDEOS = 200;
    public const array ACOES_PERMITIDAS = [AcaoRevisaoVideo::NaoMusica, AcaoRevisaoVideo::ManterCompilacao];

    /**
     * @param list<string> $videoUuids
     */
    public function __construct(
        #[Assert\Choice(choices: self::ACOES_PERMITIDAS)]
        public AcaoRevisaoVideo $acao,
        #[Assert\Count(min: 1, max: self::LIMITE_VIDEOS)]
        #[Assert\All([new Assert\NotBlank(), new Assert\Uuid()])]
        public array $videoUuids = [],
    ) {
    }
}
