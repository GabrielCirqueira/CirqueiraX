<?php

declare(strict_types=1);

namespace App\Service\Usuario;

use App\DataObject\CriarUsuarioDTO;
use App\Entity\Usuario;
use App\Exception\Usuario\UsuarioException;
use App\Repository\UsuarioRepository;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final readonly class CriarUsuarioService
{
    public function __construct(
        private UsuarioRepository $usuarioRepository,
        private UserPasswordHasherInterface $hasher,
        private ValidatorInterface $validator,
    ) {}

    public function executar(CriarUsuarioDTO $dto): Usuario
    {
        $violacoes = $this->validator->validate($dto);
        if (count($violacoes) > 0) {
            $primeiroErro = $violacoes->get(0)->getMessage();
            throw UsuarioException::dadosInvalidos((string) $primeiroErro);
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
        $usuario->setRoles($dto->roles);
        $usuario->setPassword($this->hasher->hashPassword($usuario, $dto->senha));

        $this->usuarioRepository->salvar($usuario);

        return $usuario;
    }
}
