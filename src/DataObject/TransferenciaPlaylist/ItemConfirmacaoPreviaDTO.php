<?php

declare(strict_types=1);

namespace App\DataObject\TransferenciaPlaylist;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ItemConfirmacaoPreviaDTO
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Uuid]
        public string $uuid,
        #[Assert\NotBlank]
        #[Assert\Choice(choices: ['casada', 'duvidosa', 'nao_encontrada', 'ignorada'])]
        public string $status,
        #[Assert\Length(max: 128)]
        public ?string $idExternoDestino = null,
        #[Assert\Length(max: 512)]
        public ?string $tituloDestino = null,
        #[Assert\Length(max: 512)]
        public ?string $artistasDestino = null,
    ) {
    }
}
