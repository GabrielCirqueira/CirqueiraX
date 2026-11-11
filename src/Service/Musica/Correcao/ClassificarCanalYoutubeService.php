<?php

declare(strict_types=1);

namespace App\Service\Musica\Correcao;

use App\DataObject\Musica\ClassificarCanalDTO;
use App\Entity\RegraCanalYoutube;
use App\Entity\Usuario;
use App\Enum\ClassificacaoCanal;
use App\Enum\OrigemClassificacao;
use App\Enum\StatusClassificacaoVideo;
use App\Repository\RegraCanalYoutubeRepository;
use App\Repository\VideoYoutubeRepository;
use App\Service\Musica\NormalizarTextoMusicaService;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class ClassificarCanalYoutubeService
{
    private const int CONFIANCA_REGRA = 100;
    private const array STATUS_AFETADOS = [StatusClassificacaoVideo::Pendente, StatusClassificacaoVideo::Revisar, StatusClassificacaoVideo::Compilacao];

    public function __construct(
        private RegraCanalYoutubeRepository $regraRepository,
        private VideoYoutubeRepository $videoRepository,
        private NormalizarTextoMusicaService $normalizador,
        private CacheAnaliseSpotifyService $cacheAnalise,
    ) {
    }

    public function executar(Usuario $usuario, ClassificarCanalDTO $dto): int
    {
        $canalNormalizado = $this->normalizador->normalizar($dto->canal);
        $regra = $this->regraRepository->buscarPorCanal($usuario, $canalNormalizado);
        if (null === $regra) {
            $this->regraRepository->salvar(new RegraCanalYoutube($usuario, $canalNormalizado, $dto->classificacao), flush: false);
        }
        $regra?->reclassificar($dto->classificacao);

        $afetados = 0;
        foreach ($this->videoRepository->listarDoCanal($usuario, $dto->canal) as $video) {
            $regraAnterior = OrigemClassificacao::RegraCanal === $video->origemClassificacao();
            if ($video->isClassificadoManualmente() || (!in_array($video->status(), self::STATUS_AFETADOS, true) && !$regraAnterior)) {
                continue;
            }

            if (ClassificacaoCanal::NaoMusica === $dto->classificacao) {
                $video->classificar(StatusClassificacaoVideo::NaoMusica, OrigemClassificacao::RegraCanal, self::CONFIANCA_REGRA, null, null);
                ++$afetados;

                continue;
            }

            $video->voltarParaPendente();
            ++$afetados;
        }

        $this->videoRepository->flush();
        $this->cacheAnalise->invalidar($usuario);

        return $afetados;
    }
}
