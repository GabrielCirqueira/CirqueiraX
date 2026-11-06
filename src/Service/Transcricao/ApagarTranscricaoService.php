<?php

declare(strict_types=1);

namespace App\Service\Transcricao;

use App\Entity\Usuario;
use App\Exception\Transcricao\TranscricaoException;
use App\Interface\ArmazenamentoTranscricaoInterface;
use App\Repository\TranscricaoRepository;

final readonly class ApagarTranscricaoService
{
    public function __construct(
        private ConsultarTranscricoesService $consultarTranscricoesService,
        private TranscricaoRepository $transcricaoRepository,
        private ArmazenamentoTranscricaoInterface $armazenamento,
    ) {}

    public function executar(string $uuid, Usuario $usuario): void
    {
        $transcricao = $this->consultarTranscricoesService->obterDoUsuario($uuid, $usuario);
        if (!$transcricao->isApagavel()) {
            throw TranscricaoException::naoPodeApagarDuranteTranscricao();
        }

        $caminhoArquivo = $transcricao->caminhoArquivo();
        if (null !== $caminhoArquivo) {
            $this->armazenamento->remover($caminhoArquivo);
        }

        $this->transcricaoRepository->remover($transcricao);
    }
}
