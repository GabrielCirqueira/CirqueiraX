<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Entity\ImportacaoYoutube;
use App\Entity\Usuario;
use App\Exception\ImportacaoYoutube\ImportacaoYoutubeException;
use App\Repository\ImportacaoYoutubeRepository;

final readonly class ConsultarImportacaoYoutubeService
{
    public function __construct(
        private ImportacaoYoutubeRepository $importacaoRepository,
    ) {
    }

    public function executar(string $uuid, Usuario $usuario): ImportacaoYoutube
    {
        return $this->importacaoRepository->buscarDoUsuario($usuario, $uuid) ?? throw ImportacaoYoutubeException::importacaoNaoEncontrada();
    }
}
