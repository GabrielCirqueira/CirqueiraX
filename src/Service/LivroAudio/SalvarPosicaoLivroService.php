<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\DataObject\SalvarPosicaoLivroDTO;
use App\Entity\LivroAudio;
use App\Entity\Usuario;
use App\Repository\LivroAudioRepository;

final readonly class SalvarPosicaoLivroService
{
    public function __construct(
        private ConsultarLivrosAudioService $consultarLivrosAudioService,
        private LivroAudioRepository $livroAudioRepository,
    ) {}

    public function executar(string $uuid, SalvarPosicaoLivroDTO $dto, Usuario $usuario): LivroAudio
    {
        $livro = $this->consultarLivrosAudioService->obterDoUsuario($uuid, $usuario);

        if (!$livro->aceitaPosicaoRegistradaEm($dto->registradaEm())) {
            return $livro;
        }

        $livro->atualizarPosicao(
            $dto->paginaAtual(),
            $dto->blocoAtual(),
            $dto->segundosNoBloco(),
            $dto->registradaEm(),
        );

        $this->livroAudioRepository->salvar($livro, true);

        return $livro;
    }
}
