<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Entity\ImportacaoYoutube;
use App\Enum\ResultadoEtapaImportacaoYoutube;
use App\Interface\ArmazenamentoImportacaoYoutubeInterface;
use App\Repository\ImportacaoYoutubeRepository;

final readonly class LerArquivoImportacaoYoutubeService
{
    public function __construct(
        private ImportarHistoricoTakeoutYoutubeService $importarService,
        private ImportacaoYoutubeRepository $importacaoRepository,
        private ArmazenamentoImportacaoYoutubeInterface $armazenamento,
    ) {
    }

    public function executar(ImportacaoYoutube $importacao): ResultadoEtapaImportacaoYoutube
    {
        $uuid = $importacao->uuid()->toRfc4122();
        $caminhoArquivo = $importacao->caminhoArquivo();
        $importacao->iniciarProcessamento();
        $this->importacaoRepository->salvar($importacao);

        try {
            $resultado = $this->importarService->executar($caminhoArquivo, $importacao->usuario());
        } finally {
            $this->armazenamento->removerArquivo($caminhoArquivo);
        }

        $atualizada = $this->importacaoRepository->buscarPorUuid($uuid) ?? $importacao;
        $atualizada->registrarLeitura(
            totalLidos: $resultado->totalLidos,
            totalDescartados: $resultado->totalDescartados,
            totalNovos: $resultado->totalNovos,
            totalIgnorados: $resultado->totalIgnorados,
            totalUnificados: $resultado->totalUnificados,
            totalVideosNovos: $resultado->totalVideosNovos,
            primeiraReproducaoEm: $resultado->primeiraReproducaoEm,
            ultimaReproducaoEm: $resultado->ultimaReproducaoEm,
        );
        $this->importacaoRepository->salvar($atualizada);

        return ResultadoEtapaImportacaoYoutube::Continuar;
    }
}
