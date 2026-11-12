<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Entity\ImportacaoYoutube;
use App\Entity\Usuario;
use App\Repository\ImportacaoYoutubeRepository;

final readonly class ListarImportacoesYoutubeService
{
    public const int LIMITE_RECENTES = 10;

    public function __construct(
        private ImportacaoYoutubeRepository $importacaoRepository,
    ) {
    }

    /**
     * @return array{recentes: list<ImportacaoYoutube>, relatoriosNaoVistos: list<ImportacaoYoutube>}
     */
    public function executar(Usuario $usuario): array
    {
        return [
            'recentes' => $this->importacaoRepository->listarRecentes($usuario, self::LIMITE_RECENTES),
            'relatoriosNaoVistos' => $this->importacaoRepository->listarRelatoriosNaoVistos($usuario),
        ];
    }
}
