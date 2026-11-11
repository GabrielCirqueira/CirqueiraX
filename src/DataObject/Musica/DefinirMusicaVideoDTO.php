<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use App\Enum\AcaoRevisaoVideo;
use App\Enum\TipoVersaoMusica;
use App\Service\IdentificacaoMusica\AplicarIdentificacaoVideoYoutubeService;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class DefinirMusicaVideoDTO
{
    /**
     * @param list<string>                     $artistas
     * @param list<ComponenteMashupEntradaDTO> $componentes
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
        #[Assert\Count(max: AplicarIdentificacaoVideoYoutubeService::LIMITE_COMPONENTES_MASHUP)]
        #[Assert\Valid]
        public array $componentes = [],
    ) {
    }
}
