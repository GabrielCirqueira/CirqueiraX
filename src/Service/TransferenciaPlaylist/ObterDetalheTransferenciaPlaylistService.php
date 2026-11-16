<?php

declare(strict_types=1);

namespace App\Service\TransferenciaPlaylist;

use App\Entity\TransferenciaPlaylist;
use App\Entity\Usuario;
use App\Exception\TransferenciaPlaylist\TransferenciaPlaylistException;
use App\Repository\TransferenciaPlaylistRepository;

final readonly class ObterDetalheTransferenciaPlaylistService
{
    public function __construct(
        private TransferenciaPlaylistRepository $transferenciaRepository,
    ) {
    }

    public function executar(Usuario $usuario, string $transferenciaUuid): TransferenciaPlaylist
    {
        $transferencia = $this->transferenciaRepository->buscarDoUsuarioPorUuid($usuario, $transferenciaUuid);
        if (null === $transferencia) {
            throw TransferenciaPlaylistException::transferenciaNaoEncontrada();
        }

        return $transferencia;
    }
}
