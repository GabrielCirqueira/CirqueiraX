<?php

declare(strict_types=1);

namespace App\Service\TransferenciaPlaylist;

use App\Entity\Usuario;
use App\Entity\VinculoPlaylist;
use App\Repository\VinculoPlaylistRepository;

final readonly class ListarVinculosPlaylistService
{
    public function __construct(
        private VinculoPlaylistRepository $vinculoRepository,
    ) {
    }

    /**
     * @return list<VinculoPlaylist>
     */
    public function executar(Usuario $usuario): array
    {
        return $this->vinculoRepository->listarDoUsuario($usuario);
    }
}
