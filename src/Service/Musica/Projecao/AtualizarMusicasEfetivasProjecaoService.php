<?php

declare(strict_types=1);

namespace App\Service\Musica\Projecao;

use App\Entity\Usuario;
use App\Repository\ReproducaoMusicalRepository;

final readonly class AtualizarMusicasEfetivasProjecaoService
{
    public function __construct(
        private ReproducaoMusicalRepository $reproducaoMusicalRepository,
    ) {
    }

    public function executar(Usuario $usuario): int
    {
        return $this->reproducaoMusicalRepository->atualizarMusicasEfetivas($usuario);
    }
}
