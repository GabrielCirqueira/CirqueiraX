<?php

declare(strict_types=1);

namespace App\Service\Usuario;

use App\DataObject\Usuario\AtualizarPerfilDTO;
use App\Entity\Usuario;
use App\Exception\Usuario\UsuarioException;
use App\Repository\UsuarioRepository;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final readonly class AtualizarPerfilService
{
    public function __construct(
        private UsuarioRepository $usuarioRepository,
        private ValidatorInterface $validator,
    ) {}

    public function executar(Usuario $usuario, AtualizarPerfilDTO $dto): Usuario
    {
        $violacoes = $this->validator->validate($dto);
        if (count($violacoes) > 0) {
            throw UsuarioException::dadosInvalidos((string) $violacoes->get(0)->getMessage());
        }

        $email = mb_strtolower(trim($dto->email));
        $nomeCompleto = trim($dto->nomeCompleto);

        if ($email !== $usuario->getEmail() && $this->usuarioRepository->emailJaExiste($email)) {
            throw UsuarioException::emailJaEmUso($email);
        }

        $usuario->setNomeCompleto($nomeCompleto);
        $usuario->setEmail($email);
        $this->usuarioRepository->salvar($usuario);

        return $usuario;
    }
}
