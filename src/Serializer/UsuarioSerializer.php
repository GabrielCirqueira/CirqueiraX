<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\Usuario;
use App\Enum\FuncionalidadeSistema;
use DateTimeInterface;

final class UsuarioSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function normalizar(Usuario $usuario): array
    {
        $permissoes = $usuario->isAdministrador()
            ? FuncionalidadeSistema::valores()
            : $usuario->permissoes();

        return [
            'id' => $usuario->getId(),
            'nomeCompleto' => $usuario->getNomeCompleto(),
            'username' => $usuario->getUsername(),
            'email' => $usuario->getEmail(),
            'roles' => $usuario->getRoles(),
            'administrador' => $usuario->isAdministrador(),
            'permissoes' => $permissoes,
            'criadoEm' => $usuario->getCriadoEm()->format(DateTimeInterface::ATOM),
            'atualizadoEm' => $usuario->getAtualizadoEm()->format(DateTimeInterface::ATOM),
        ];
    }

    /**
     * @param list<Usuario> $usuarios
     *
     * @return list<array<string, mixed>>
     */
    public function normalizarLista(array $usuarios): array
    {
        return array_map($this->normalizar(...), $usuarios);
    }
}
