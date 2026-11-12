<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\DataObject\YoutubeMusic\ResumoExtensaoYoutubeDTO;
use App\Entity\ContaYoutubeMusic;
use App\Entity\ReproducaoYoutube;
use App\Entity\Usuario;
use App\Repository\ContaYoutubeMusicRepository;
use App\Repository\ReproducaoYoutubeRepository;
use App\Repository\TokenExtensaoYoutubeMusicRepository;
use DateTimeImmutable;

final readonly class ObterStatusYoutubeMusicService
{
    private const string JANELA_TOCANDO_AGORA = '-75 seconds';

    public function __construct(
        private ContaYoutubeMusicRepository $contaRepository,
        private ReproducaoYoutubeRepository $reproducaoRepository,
        private TokenExtensaoYoutubeMusicRepository $tokenExtensaoRepository,
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

    public function resumirExtensao(Usuario $usuario): ResumoExtensaoYoutubeDTO
    {
        return new ResumoExtensaoYoutubeDTO(
            $this->tokenExtensaoRepository->contarAtivosDoUsuario($usuario),
            $this->reproducaoRepository->buscarUltimoEventoDaExtensao($usuario),
            $this->reproducaoRepository->buscarTocandoAgoraDaExtensao($usuario, new DateTimeImmutable(self::JANELA_TOCANDO_AGORA)),
        );
    }

    public function buscarUltimaDetectada(Usuario $usuario): ?ReproducaoYoutube
    {
        return $this->reproducaoRepository->buscarUltimaAntesDe($usuario, new DateTimeImmutable('+1 day'));
    }
}
