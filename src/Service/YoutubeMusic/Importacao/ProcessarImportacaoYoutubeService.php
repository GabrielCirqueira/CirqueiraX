<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Interface\ArmazenamentoImportacaoYoutubeInterface;
use App\Repository\ImportacaoYoutubeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;
use Throwable;

final readonly class ProcessarImportacaoYoutubeService
{
    public function __construct(
        private ImportacaoYoutubeRepository $importacaoRepository,
        private ImportarHistoricoTakeoutYoutubeService $importarService,
        private ArmazenamentoImportacaoYoutubeInterface $armazenamento,
        private ManagerRegistry $managerRegistry,
    ) {
    }

    public function executar(string $importacaoUuid): void
    {
        $importacao = $this->importacaoRepository->buscarPorUuid($importacaoUuid);
        if (null === $importacao || $importacao->isFinalizada()) {
            return;
        }

        $caminhoArquivo = $importacao->caminhoArquivo();
        $importacao->iniciarProcessamento();
        $this->importacaoRepository->salvar($importacao);

        try {
            $resultado = $this->importarService->executar($caminhoArquivo, $importacao->usuario());
            $atualizada = $this->importacaoRepository->buscarPorUuid($importacaoUuid) ?? $importacao;
            $atualizada->registrarLeitura(
                totalLidos: $resultado->totalLidos,
                totalDescartados: $resultado->totalDescartados,
                totalNovos: $resultado->totalNovos,
                totalIgnorados: $resultado->totalIgnorados,
                totalUnificados: $resultado->totalUnificados,
                totalVideosNovos: $resultado->totalVideosNovos,
            )->concluir();
            $this->importacaoRepository->salvar($atualizada);
        } catch (Throwable $erro) {
            $this->registrarFalha($importacaoUuid, $erro->getMessage());
        } finally {
            $this->armazenamento->removerArquivo($caminhoArquivo);
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
