<?php

declare(strict_types=1);

namespace App\Service\IdentificacaoMusica;

use App\Entity\Usuario;
use App\Enum\StatusClassificacaoVideo;
use App\Repository\VideoYoutubeRepository;

final readonly class ObterResumoIdentificacaoService
{
    public function __construct(
        private VideoYoutubeRepository $videoRepository,
    ) {}

    /**
     * @return array{pendentes: int, emRevisao: int, compilacoes: int, porStatus: array<string, int>, total: int}
     */
    public function executar(Usuario $usuario): array
    {
        $porStatus = $this->videoRepository->contarPorStatus($usuario);
        foreach (StatusClassificacaoVideo::cases() as $status) {
            $porStatus[$status->value] ??= 0;
        }

        return [
            'pendentes' => $porStatus[StatusClassificacaoVideo::Pendente->value],
            'emRevisao' => $porStatus[StatusClassificacaoVideo::Revisar->value],
            'compilacoes' => $porStatus[StatusClassificacaoVideo::Compilacao->value],
            'porStatus' => $porStatus,
            'total' => array_sum($porStatus),
        ];
    }
}
