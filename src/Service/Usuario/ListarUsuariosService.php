<?php

declare(strict_types=1);

namespace App\Service\Usuario;

use App\Entity\Usuario;
use App\Repository\UsuarioRepository;

final readonly class ListarUsuariosService
{
    public function __construct(
        private UsuarioRepository $usuarioRepository,
    ) {}

    /**
     * @return list<Usuario>
     */
    public function executar(): array
    {
        return $this->usuarioRepository->listarTodosOrdenados();
    }
}
