<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Entity\ImportacaoYoutube;
use App\Enum\EtapaImportacaoYoutube;
use App\Exception\ImportacaoYoutube\ImportacaoYoutubeException;
use App\Repository\ImportacaoYoutubeRepository;

final readonly class RetomarImportacaoYoutubeService
{
    public function __construct(
        private ImportacaoYoutubeRepository $importacaoRepository,
    ) {
    }

    public function executar(string $uuid): ImportacaoYoutube
    {
        $importacao = $this->importacaoRepository->buscarPorUuid($uuid) ?? throw ImportacaoYoutubeException::importacaoNaoEncontrada();

        if (!$importacao->isErro()) {
            return $importacao;
        }

        if (EtapaImportacaoYoutube::Leitura === $importacao->etapa()) {
            throw ImportacaoYoutubeException::leituraNaoRetomavel();
        }

        $importacao->retomar();
        $this->importacaoRepository->salvar($importacao);

        return $importacao;
    }
}
