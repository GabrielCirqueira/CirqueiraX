<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\Interface\ArmazenamentoImportacaoSpotifyInterface;
use App\Repository\ImportacaoSpotifyRepository;

final readonly class ProcessarArquivoImportacaoSpotifyService
{
    public function __construct(
        private ImportacaoSpotifyRepository $importacaoRepository,
        private DeduplicarEImportarHistoricoSpotifyService $deduplicadorService,
        private ArmazenamentoImportacaoSpotifyInterface $armazenamento,
    ) {}

    public function executar(string $importacaoUuid): void
    {
        $importacao = $this->importacaoRepository->buscarPorUuid($importacaoUuid);
        if (null === $importacao || $importacao->isFinalizada()) {
            return;
        }

        $importacao->iniciarProcessamento();
        $this->importacaoRepository->salvar($importacao);

        try {
            $resultado = $this->deduplicadorService->executar(
                caminhoArquivo: $importacao->caminhoArquivo(),
                usuario: $importacao->usuario(),
            );

            $importacao->concluir(
                totalLidos: $resultado->totalLidos(),
                totalNovos: $resultado->totalNovos(),
                totalIgnorados: $resultado->totalIgnorados(),
                totalSubstituidos: $resultado->totalSubstituidos(),
            );
            $this->importacaoRepository->salvar($importacao);
        } catch (\Throwable $e) {
            $importacao->falhar($e->getMessage());
            $this->importacaoRepository->salvar($importacao);
        } finally {
            $this->armazenamento->removerArquivo($importacao->caminhoArquivo());
        }
    }
}
