<?php

declare(strict_types=1);

namespace App\Service\Usuario;

use App\DataObject\Usuario\AlterarSenhaDTO;
use App\Entity\Usuario;
use App\Exception\Usuario\UsuarioException;
use App\Repository\UsuarioRepository;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final readonly class AlterarSenhaPropriaService
{
    public function __construct(
        private UsuarioRepository $usuarioRepository,
        private UserPasswordHasherInterface $hasher,
        private ValidatorInterface $validator,
    ) {}

    public function executar(Usuario $usuario, AlterarSenhaDTO $dto): Usuario
    {
        $violacoes = $this->validator->validate($dto);
        if (count($violacoes) > 0) {
            throw UsuarioException::dadosInvalidos((string) $violacoes->get(0)->getMessage());
        }

        if (!$this->hasher->isPasswordValid($usuario, $dto->senhaAtual)) {
            throw UsuarioException::senhaAtualIncorreta();
        }

        if ($dto->novaSenha !== $dto->confirmacaoSenha) {
            throw UsuarioException::confirmacaoSenhaDivergente();
        }

        if ($dto->senhaAtual === $dto->novaSenha) {
            throw UsuarioException::novaSenhaIgualAtual();
        }

        $usuario->setPassword($this->hasher->hashPassword($usuario, $dto->novaSenha));
        $this->usuarioRepository->salvar($usuario);

        return $usuario;
    }
}
