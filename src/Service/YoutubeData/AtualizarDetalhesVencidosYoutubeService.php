<?php

declare(strict_types=1);

namespace App\Service\YoutubeData;

use App\Repository\VideoYoutubeRepository;
use DateTimeImmutable;

final readonly class AtualizarDetalhesVencidosYoutubeService
{
    public const int DIAS_VALIDADE_DETALHES = 30;
    private const int LIMITE_POR_RODADA = 500;
    private const string FORMATO_DIAS_ATRAS = '-%d days';

    public function __construct(
        private VideoYoutubeRepository $videoRepository,
        private AtualizarDetalhesVideosYoutubeService $atualizarDetalhes,
    ) {
    }

    public function executar(): int
    {
        $limite = new DateTimeImmutable(sprintf(self::FORMATO_DIAS_ATRAS, self::DIAS_VALIDADE_DETALHES));
        $videos = $this->videoRepository->listarComDetalhesVencidos($limite, self::LIMITE_POR_RODADA);

        return $this->atualizarDetalhes->executar($videos);
    }
}
