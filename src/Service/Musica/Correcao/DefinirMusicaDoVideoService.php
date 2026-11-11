<?php

declare(strict_types=1);

namespace App\Service\Musica\Correcao;

use App\DataObject\Musica\DefinirMusicaVideoDTO;
use App\Entity\MusicaCatalogo;
use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Enum\AcaoRevisaoVideo;
use App\Enum\OrigemClassificacao;
use App\Enum\StatusClassificacaoVideo;
use App\Exception\Musica\MusicaCatalogoException;
use App\Repository\MusicaCatalogoRepository;
use App\Repository\VideoYoutubeRepository;
use App\Service\Musica\ObterMusicaCatalogoService;
use App\Service\Musica\Projecao\ProjetarReproducoesYoutubeService;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class DefinirMusicaDoVideoService
{
    private const int CONFIANCA_MANUAL = 100;

    public function __construct(
        private VideoYoutubeRepository $videoRepository,
        private MusicaCatalogoRepository $musicaRepository,
        private ObterMusicaCatalogoService $obterMusica,
        private CacheAnaliseSpotifyService $cacheAnalise,
        private ProjetarReproducoesYoutubeService $projetarYoutube,
    ) {
    }

    public function executar(Usuario $usuario, string $videoUuid, DefinirMusicaVideoDTO $dto): VideoYoutube
    {
        $video = $this->videoRepository->buscarDoUsuario($usuario, $videoUuid) ?? throw MusicaCatalogoException::videoNaoEncontrado();

        match ($dto->acao) {
            AcaoRevisaoVideo::NaoMusica => $video->classificar(StatusClassificacaoVideo::NaoMusica, OrigemClassificacao::Manual, self::CONFIANCA_MANUAL, null, null),
            AcaoRevisaoVideo::ManterCompilacao => $video->classificar(StatusClassificacaoVideo::Compilacao, OrigemClassificacao::Manual, self::CONFIANCA_MANUAL, null, null),
            AcaoRevisaoVideo::DefinirMusica => $this->definirMusica($usuario, $video, $dto),
        };

        $this->videoRepository->flush();
        $this->projetarYoutube->projetarVideos($usuario, [$video]);
        $this->cacheAnalise->invalidar($usuario);

        return $video;
    }

    private function definirMusica(Usuario $usuario, VideoYoutube $video, DefinirMusicaVideoDTO $dto): VideoYoutube
    {
        $musica = $this->obterMusicaEscolhida($usuario, $dto)->confirmarManualmente();
        $status = $musica->isMashup() ? StatusClassificacaoVideo::Mashup : StatusClassificacaoVideo::Musica;

        return $video->classificar($status, OrigemClassificacao::Manual, self::CONFIANCA_MANUAL, $dto->versao, $musica);
    }

    private function obterMusicaEscolhida(Usuario $usuario, DefinirMusicaVideoDTO $dto): MusicaCatalogo
    {
        if (null !== $dto->musicaUuid) {
            $musica = $this->musicaRepository->buscarDoUsuario($usuario, $dto->musicaUuid) ?? throw MusicaCatalogoException::musicaNaoEncontrada();

            return $musica->musicaEfetiva();
        }

        if (null === $dto->titulo || '' === trim($dto->titulo) || [] === $dto->artistas) {
            throw MusicaCatalogoException::dadosDaMusicaAusentes();
        }

        return $this->obterMusica->obterMusica($usuario, $dto->titulo, $dto->artistas);
    }
}
