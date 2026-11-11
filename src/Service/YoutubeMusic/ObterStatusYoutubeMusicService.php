<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\Entity\ContaYoutubeMusic;
use App\Entity\ReproducaoYoutube;
use App\Entity\Usuario;
use App\Repository\ContaYoutubeMusicRepository;
use App\Repository\ReproducaoYoutubeRepository;
use DateTimeImmutable;

final readonly class ObterStatusYoutubeMusicService
{
    public function __construct(
        private ContaYoutubeMusicRepository $contaRepository,
        private ReproducaoYoutubeRepository $reproducaoRepository,
    ) {
    }

    public function executar(Usuario $usuario): ?ContaYoutubeMusic
    {
        return $this->contaRepository->buscarDoUsuario($usuario);
    }

    public function contarReproducoesColetadas(Usuario $usuario): int
    {
        return $this->reproducaoRepository->contarDoUsuario($usuario);
    }

    public function buscarUltimaDetectada(Usuario $usuario): ?ReproducaoYoutube
    {
        return $this->reproducaoRepository->buscarUltimaAntesDe($usuario, new DateTimeImmutable('+1 day'));
    }
}
