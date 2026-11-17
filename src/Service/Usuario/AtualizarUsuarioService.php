<?php

declare(strict_types=1);

namespace App\Service\Usuario;

use App\DataObject\Usuario\AtualizarUsuarioDTO;
use App\Entity\Usuario;
use App\Exception\Usuario\UsuarioException;
use App\Repository\UsuarioRepository;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final readonly class AtualizarUsuarioService
{
    public function __construct(
        private UsuarioRepository $usuarioRepository,
        private ObterUsuarioService $obterUsuario,
        private NormalizarPermissoesUsuarioService $normalizarPermissoes,
        private UserPasswordHasherInterface $hasher,
        private ValidatorInterface $validator,
    ) {}

    public function executar(int $id, AtualizarUsuarioDTO $dto, Usuario $ator): Usuario
    {
        $violacoes = $this->validator->validate($dto);
        if (count($violacoes) > 0) {
            throw UsuarioException::dadosInvalidos((string) $violacoes->get(0)->getMessage());
        }

        $usuario = $this->obterUsuario->executar($id);
        $email = mb_strtolower(trim($dto->email));
        $nomeCompleto = trim($dto->nomeCompleto);

        if ($email !== $usuario->getEmail() && $this->usuarioRepository->emailJaExiste($email)) {
            throw UsuarioException::emailJaEmUso($email);
        }

        if ($ator->getId() === $usuario->getId() && $usuario->isAdministrador() && !$dto->administrador) {
            throw UsuarioException::naoPodeAlterarProprioPerfilAdministrador();
        }

        $usuario->setNomeCompleto($nomeCompleto);
        $usuario->setEmail($email);

        if ($dto->administrador) {
            $usuario->promoverAdministrador();
            $usuario->definirPermissoes([]);
        }

        if (!$dto->administrador) {
            $usuario->rebaixarAdministrador();
            $usuario->definirPermissoes($this->normalizarPermissoes->executar($dto->permissoes ?? []));
        }

        if (null !== $dto->senha && '' !== trim($dto->senha)) {
            $usuario->setPassword($this->hasher->hashPassword($usuario, $dto->senha));
        }

        $this->usuarioRepository->salvar($usuario);

        return $usuario;
    }
}
