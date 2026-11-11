<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Entity\ImportacaoYoutube;
use App\Enum\FinalidadeConsumoIa;
use App\Enum\ResultadoEtapaImportacaoYoutube;
use App\Repository\ConsumoIaRepository;
use App\Repository\ImportacaoYoutubeRepository;
use App\Repository\VideoYoutubeRepository;
use App\Service\IdentificacaoMusica\IdentificarVideosYoutubeService;
use DateTimeImmutable;

final readonly class ClassificarVideosImportacaoYoutubeService
{
    private const int LIMITE_POR_RODADA = 100;

    public function __construct(
        private VideoYoutubeRepository $videoRepository,
        private ImportacaoYoutubeRepository $importacaoRepository,
        private IdentificarVideosYoutubeService $identificarVideos,
        private ConsumoIaRepository $consumoRepository,
    ) {
    }

    public function executar(ImportacaoYoutube $importacao): ResultadoEtapaImportacaoYoutube
    {
        $uuid = $importacao->uuid()->toRfc4122();
        $usuario = $importacao->usuario();
        $videos = $this->videoRepository->listarReservadosPendentes($usuario, null, self::LIMITE_POR_RODADA);

        if ([] === $videos) {
            $importacao->iniciarTempoOuvido();
            $this->importacaoRepository->salvar($importacao);

            return ResultadoEtapaImportacaoYoutube::Continuar;
        }

        $this->identificarVideos->executar($usuario, $videos);
        $classificados = $this->videoRepository->liberarReservadosResolvidos($usuario);
        $consumo = $this->consumoRepository->somarDoUsuarioDesde(
            $usuario,
            FinalidadeConsumoIa::IdentificacaoMusica,
            $importacao->classificacaoIniciadaEm() ?? new DateTimeImmutable(),
        );

        $this->videoRepository->limparCache();
        $atualizada = $this->importacaoRepository->buscarPorUuid($uuid) ?? $importacao;
        $atualizada->registrarClassificados($classificados, $consumo['tokensEntrada'], $consumo['tokensSaida'], $consumo['custoMicrodolares']);
        $this->importacaoRepository->salvar($atualizada);

        return 0 === $classificados ? ResultadoEtapaImportacaoYoutube::Aguardar : ResultadoEtapaImportacaoYoutube::Continuar;
    }
}
