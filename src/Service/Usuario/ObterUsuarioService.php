<?php

declare(strict_types=1);

namespace App\Service\Usuario;

use App\Entity\Usuario;
use App\Exception\Usuario\UsuarioException;
use App\Repository\UsuarioRepository;

final readonly class ObterUsuarioService
{
    public function __construct(
        private UsuarioRepository $usuarioRepository,
    ) {}

    public function executar(int $id): Usuario
    {
        $usuario = $this->usuarioRepository->buscarPorId($id);
        if (null === $usuario) {
            throw UsuarioException::naoEncontrado();
        }

        return $usuario;
    }
}
