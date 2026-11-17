<?php

declare(strict_types=1);

namespace App\Service\Usuario;

use App\Entity\Usuario;
use App\Exception\Usuario\UsuarioException;
use App\Repository\UsuarioRepository;

final readonly class GarantirAdministradorPrincipalService
{
    public const string EMAIL_PRINCIPAL = 'gabrielcirqueira711@gmail.com';

    public function __construct(
        private UsuarioRepository $usuarioRepository,
    ) {}

    public function executar(?string $email = null): Usuario
    {
        $emailAlvo = mb_strtolower(trim($email ?? self::EMAIL_PRINCIPAL));
        $usuario = $this->usuarioRepository->buscarPorEmail($emailAlvo);
        if (null === $usuario) {
            throw UsuarioException::naoEncontrado();
        }

        $usuario->promoverAdministrador();
        $usuario->definirPermissoes([]);
        $this->usuarioRepository->salvar($usuario);

        return $usuario;
    }
}
