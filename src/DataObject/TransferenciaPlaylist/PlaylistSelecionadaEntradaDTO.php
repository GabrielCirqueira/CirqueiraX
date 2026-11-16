<?php

declare(strict_types=1);

namespace App\DataObject\TransferenciaPlaylist;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class PlaylistSelecionadaEntradaDTO
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 128)]
        public string $idExterno,
        #[Assert\Length(max: 40)]
        public ?string $decisao = null,
        #[Assert\Length(max: 128)]
        public ?string $idDestinoExistente = null,
    ) {
    }
}
