<?php

declare(strict_types=1);

namespace App\Service\Transcricao;

use App\DataObject\Transcricao\AtualizarTranscricaoDTO;
use App\Entity\Transcricao;
use App\Entity\Usuario;
use App\Repository\TranscricaoRepository;
use App\Support\TextoUtil;

final readonly class AtualizarTranscricaoService
{
    public function __construct(
        private ConsultarTranscricoesService $consultarTranscricoesService,
        private TranscricaoRepository $transcricaoRepository,
    ) {}

    public function executar(string $uuid, AtualizarTranscricaoDTO $dto, Usuario $usuario): Transcricao
    {
        $transcricao = $this->consultarTranscricoesService->obterDoUsuario($uuid, $usuario);
        $titulo = $dto->titulo();

        if (TextoUtil::naoEstaEmBranco($titulo)) {
            $transcricao->renomear((string) $titulo);
        }

        if (null !== $dto->favorita()) {
            $transcricao->marcarFavorita($dto->favorita());
        }

        $this->transcricaoRepository->flush();

        return $transcricao;
    }
}
