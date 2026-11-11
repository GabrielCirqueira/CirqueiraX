<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use App\Enum\AcaoRevisaoVideo;
use App\Enum\TipoVersaoMusica;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class DefinirMusicaVideoDTO
{
    /**
     * @param list<string> $artistas
     */
    public function __construct(
        public AcaoRevisaoVideo $acao = AcaoRevisaoVideo::DefinirMusica,
        #[Assert\Uuid]
        public ?string $musicaUuid = null,
        #[Assert\Length(max: 500)]
        public ?string $titulo = null,
        #[Assert\All([new Assert\NotBlank(), new Assert\Length(max: 255)])]
        #[Assert\Count(max: 20)]
        public array $artistas = [],
        public TipoVersaoMusica $versao = TipoVersaoMusica::Original,
    ) {
    }
}
