<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use App\Service\IdentificacaoMusica\AplicarIdentificacaoVideoYoutubeService;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class DefinirComponentesMashupDTO
{
    /**
     * @param list<ComponenteMashupEntradaDTO> $componentes
     */
    public function __construct(
        #[Assert\Count(min: 2, max: AplicarIdentificacaoVideoYoutubeService::LIMITE_COMPONENTES_MASHUP)]
        #[Assert\Valid]
        public array $componentes,
    ) {
    }
}
