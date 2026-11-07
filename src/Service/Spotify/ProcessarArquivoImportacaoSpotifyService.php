<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\Interface\ArmazenamentoImportacaoSpotifyInterface;
use App\Repository\ImportacaoSpotifyRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;
use Throwable;

final readonly class ProcessarArquivoImportacaoSpotifyService
{
    public function __construct(
        private ImportacaoSpotifyRepository $importacaoRepository,
        private DeduplicarEImportarHistoricoSpotifyService $deduplicadorService,
        private ArmazenamentoImportacaoSpotifyInterface $armazenamento,
        private ManagerRegistry $managerRegistry,
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

            $importacaoAtualizada = $this->importacaoRepository->buscarPorUuid($importacaoUuid) ?? $importacao;
            $importacaoAtualizada->concluir(
                totalLidos: $resultado->totalLidos(),
                totalNovos: $resultado->totalNovos(),
                totalIgnorados: $resultado->totalIgnorados(),
                totalSubstituidos: $resultado->totalSubstituidos(),
            );
            $this->importacaoRepository->salvar($importacaoAtualizada);
        } catch (Throwable $e) {
            $this->registrarFalha($importacaoUuid, $e->getMessage());
        } finally {
            $this->armazenamento->removerArquivo($importacao->caminhoArquivo());
        }
    }

    private function registrarFalha(string $importacaoUuid, string $motivo): void
    {
        $gerenciador = $this->managerRegistry->getManager();
        if ($gerenciador instanceof EntityManagerInterface && !$gerenciador->isOpen()) {
            $this->managerRegistry->resetManager();
        }

        $importacao = $this->importacaoRepository->buscarPorUuid($importacaoUuid);
        if (null === $importacao) {
            return;
        }

        $importacao->falhar($motivo);
        $this->importacaoRepository->salvar($importacao);
    }
}
