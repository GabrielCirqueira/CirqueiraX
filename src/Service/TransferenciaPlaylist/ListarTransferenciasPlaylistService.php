<?php

declare(strict_types=1);

namespace App\Service\TransferenciaPlaylist;

use App\Entity\TransferenciaPlaylist;
use App\Entity\Usuario;
use App\Enum\StatusTransferenciaPlaylist;
use App\Repository\TransferenciaPlaylistRepository;

final readonly class ListarTransferenciasPlaylistService
{
    public function __construct(
        private TransferenciaPlaylistRepository $transferenciaRepository,
    ) {
    }

    /**
     * @return list<TransferenciaPlaylist>
     */
    public function listarPendentes(Usuario $usuario): array
    {
        return $this->transferenciaRepository->listarDoUsuarioPorStatus(
            $usuario,
            [
                StatusTransferenciaPlaylist::Casando,
                StatusTransferenciaPlaylist::Previa,
                StatusTransferenciaPlaylist::Executando,
                StatusTransferenciaPlaylist::PausadaCota,
            ],
        );
    }
}
