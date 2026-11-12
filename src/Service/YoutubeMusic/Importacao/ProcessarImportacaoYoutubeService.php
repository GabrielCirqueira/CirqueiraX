<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Entity\ImportacaoYoutube;
use App\Enum\EtapaImportacaoYoutube;
use App\Enum\ResultadoEtapaImportacaoYoutube;
use App\Repository\ImportacaoYoutubeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;
use Throwable;

final readonly class ProcessarImportacaoYoutubeService
{
    public function __construct(
        private ImportacaoYoutubeRepository $importacaoRepository,
        private LerArquivoImportacaoYoutubeService $lerArquivo,
        private EnriquecerVideosImportacaoYoutubeService $enriquecer,
        private FiltrarVideosImportacaoYoutubeService $filtrar,
        private CalcularPreviaImportacaoYoutubeService $calcularPrevia,
        private ClassificarVideosImportacaoYoutubeService $classificar,
        private CalcularTempoOuvidoImportacaoYoutubeService $calcularTempoOuvido,
        private ManagerRegistry $managerRegistry,
    ) {
    }

    public function executar(string $importacaoUuid): ResultadoEtapaImportacaoYoutube
    {
        $this->importacaoRepository->limparCache();
        $importacao = $this->importacaoRepository->buscarPorUuid($importacaoUuid);
        if (null === $importacao || $importacao->isFinalizada() || $importacao->isAguardandoConfirmacao()) {
            return ResultadoEtapaImportacaoYoutube::Parar;
        }

        if ($importacao->isEsperandoVez() && null !== $this->importacaoRepository->buscarAnteriorEmAndamento($importacao)) {
            return ResultadoEtapaImportacaoYoutube::AguardarVez;
        }

        try {
            return $this->executarEtapa($importacao);
        } catch (Throwable $erro) {
            $this->registrarFalha($importacaoUuid, $erro->getMessage());

            return ResultadoEtapaImportacaoYoutube::Parar;
        }
    }

    private function executarEtapa(ImportacaoYoutube $importacao): ResultadoEtapaImportacaoYoutube
    {
        return match ($importacao->etapa()) {
            EtapaImportacaoYoutube::Leitura => $this->lerArquivo->executar($importacao),
            EtapaImportacaoYoutube::Enriquecimento => $this->enriquecer->executar($importacao),
            EtapaImportacaoYoutube::Filtro => $this->filtrar->executar($importacao),
            EtapaImportacaoYoutube::Previa => $this->calcularPrevia->executar($importacao),
            EtapaImportacaoYoutube::Classificacao => $this->classificar->executar($importacao),
            EtapaImportacaoYoutube::TempoOuvido => $this->calcularTempoOuvido->executar($importacao),
            EtapaImportacaoYoutube::Concluida => ResultadoEtapaImportacaoYoutube::Parar,
        };
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
