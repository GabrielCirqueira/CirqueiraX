<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\DataObject\YoutubeMusic\ResumoExtensaoYoutubeDTO;
use App\Entity\ContaYoutubeMusic;
use App\Entity\ReproducaoYoutube;
use App\Entity\Usuario;
use App\Repository\ContaYoutubeMusicRepository;
use App\Repository\ReproducaoMusicalRepository;
use App\Repository\ReproducaoYoutubeRepository;
use App\Repository\TokenExtensaoYoutubeMusicRepository;
use DateTimeImmutable;

final readonly class ObterStatusYoutubeMusicService
{
    private const string JANELA_TOCANDO_AGORA = '-75 seconds';
    private const string JANELA_PAUSADA = '-5 minutes';

    public function __construct(
        private ContaYoutubeMusicRepository $contaRepository,
        private ReproducaoYoutubeRepository $reproducaoRepository,
        private TokenExtensaoYoutubeMusicRepository $tokenExtensaoRepository,
        private ReproducaoMusicalRepository $reproducaoMusicalRepository,
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
        $tocando = $this->reproducaoRepository->buscarTocandoAgoraDaExtensao($usuario, new DateTimeImmutable(self::JANELA_TOCANDO_AGORA), new DateTimeImmutable(self::JANELA_PAUSADA));
        $musica = $tocando?->video()->musica()?->musicaEfetiva();
        $historico = null === $musica ? null : $this->reproducaoMusicalRepository->resumirHistoricoDaMusica($usuario, $musica);

        return new ResumoExtensaoYoutubeDTO(
            $this->tokenExtensaoRepository->contarAtivosDoUsuario($usuario),
            $this->reproducaoRepository->buscarUltimoEventoDaExtensao($usuario),
            $tocando,
            $historico['vezes'] ?? 0,
            $historico['primeiraEm'] ?? null,
        );
    }

    public function buscarUltimaDetectada(Usuario $usuario): ?ReproducaoYoutube
    {
        return $this->reproducaoRepository->buscarUltimaAntesDe($usuario, new DateTimeImmutable('+1 day'));
    }
}
