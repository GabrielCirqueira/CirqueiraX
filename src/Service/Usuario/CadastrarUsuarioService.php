<?php

declare(strict_types=1);

namespace App\Service\Usuario;

use App\DataObject\Usuario\CadastrarUsuarioDTO;
use App\Entity\Usuario;
use App\Exception\Usuario\UsuarioException;
use App\Repository\UsuarioRepository;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final readonly class CadastrarUsuarioService
{
    public function __construct(
        private UsuarioRepository $usuarioRepository,
        private UserPasswordHasherInterface $hasher,
        private ValidatorInterface $validator,
        private NormalizarPermissoesUsuarioService $normalizarPermissoes,
    ) {}

    public function executar(CadastrarUsuarioDTO $dto): Usuario
    {
        $violacoes = $this->validator->validate($dto);
        if (count($violacoes) > 0) {
            throw UsuarioException::dadosInvalidos((string) $violacoes->get(0)->getMessage());
        }

        $email = mb_strtolower(trim($dto->email));
        $username = mb_strtolower(trim($dto->username));
        $nomeCompleto = trim($dto->nomeCompleto);

        if ($this->usuarioRepository->emailJaExiste($email)) {
            throw UsuarioException::emailJaEmUso($email);
        }

        if ($this->usuarioRepository->usernameJaExiste($username)) {
            throw UsuarioException::usernameJaEmUso($username);
        }

        $usuario = new Usuario($nomeCompleto, $username, $email);
        $usuario->setPassword($this->hasher->hashPassword($usuario, $dto->senha));

        if ($dto->administrador) {
            $usuario->promoverAdministrador();
            $usuario->definirPermissoes([]);
            $this->usuarioRepository->salvar($usuario);

            return $usuario;
        }

        $usuario->setRoles(['ROLE_USER']);
        $usuario->definirPermissoes($this->normalizarPermissoes->executar($dto->permissoes));
        $this->usuarioRepository->salvar($usuario);

        return $usuario;
    }
}
