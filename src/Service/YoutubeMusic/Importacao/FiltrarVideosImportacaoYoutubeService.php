<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Entity\ImportacaoYoutube;
use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Enum\ClassificacaoCanal;
use App\Enum\OrigemClassificacao;
use App\Enum\ResultadoEtapaImportacaoYoutube;
use App\Enum\StatusClassificacaoVideo;
use App\Repository\ImportacaoYoutubeRepository;
use App\Repository\RegraCanalYoutubeRepository;
use App\Repository\VideoYoutubeRepository;
use App\Service\Musica\NormalizarTextoMusicaService;

final readonly class FiltrarVideosImportacaoYoutubeService
{
    public const array CATEGORIAS_NAO_MUSICA_DIRETAS = ['20', '25', '26', '27', '28'];
    public const int DURACAO_MAXIMA_SEM_CATEGORIA_MUSICA_MS = 1200000;
    private const int CONFIANCA_REGRA = 100;
    private const int TAMANHO_LOTE = 500;

    public function __construct(
        private VideoYoutubeRepository $videoRepository,
        private ImportacaoYoutubeRepository $importacaoRepository,
        private RegraCanalYoutubeRepository $regraCanalRepository,
        private NormalizarTextoMusicaService $normalizador,
    ) {
    }

    public function executar(ImportacaoYoutube $importacao): ResultadoEtapaImportacaoYoutube
    {
        $uuid = $importacao->uuid()->toRfc4122();
        $usuario = $importacao->usuario();
        $indisponiveis = $this->videoRepository->contarReservadosPorStatus($usuario)[StatusClassificacaoVideo::Indisponivel->value] ?? 0;
        $descartados = 0;
        $ultimo = null;

        do {
            $videos = $this->videoRepository->listarReservadosPendentes($usuario, $ultimo, self::TAMANHO_LOTE);

            foreach ($videos as $video) {
                $descartados += $this->aplicarRegras($usuario, $video) ? 1 : 0;
                $ultimo = $video->uuid();
            }

            $this->videoRepository->flush();
            $this->videoRepository->limparCache();
            $usuario = $this->importacaoRepository->buscarPorUuid($uuid)?->usuario() ?? $usuario;
        } while (self::TAMANHO_LOTE === count($videos));

        $this->videoRepository->liberarReservadosResolvidos($usuario);
        $atualizada = $this->importacaoRepository->buscarPorUuid($uuid) ?? $importacao;
        $atualizada->registrarFiltro($descartados, $indisponiveis);
        $this->importacaoRepository->salvar($atualizada);

        return ResultadoEtapaImportacaoYoutube::Continuar;
    }

    private function aplicarRegras(Usuario $usuario, VideoYoutube $video): bool
    {
        if ($video->isClassificadoManualmente()) {
            return false;
        }

        $regra = $this->regraCanalRepository->buscarPorCanal($usuario, $this->normalizador->normalizar($video->canal()));
        if (null !== $regra && ClassificacaoCanal::NaoMusica === $regra->classificacao()) {
            $video->classificar(StatusClassificacaoVideo::NaoMusica, OrigemClassificacao::RegraCanal, self::CONFIANCA_REGRA, null, null);

            return true;
        }

        if (!$this->isNaoMusicaPorDetalhes($video)) {
            return false;
        }

        $video->classificar(StatusClassificacaoVideo::NaoMusica, OrigemClassificacao::Regra, self::CONFIANCA_REGRA, null, null);

        return true;
    }

    private function isNaoMusicaPorDetalhes(VideoYoutube $video): bool
    {
        $categoria = $video->categoriaYoutube();
        if (in_array($categoria, self::CATEGORIAS_NAO_MUSICA_DIRETAS, true)) {
            return true;
        }

        $duracao = $video->duracaoMs();

        return null !== $duracao
            && VideoYoutube::CATEGORIA_MUSICA !== $categoria
            && $duracao > self::DURACAO_MAXIMA_SEM_CATEGORIA_MUSICA_MS;
    }
}
