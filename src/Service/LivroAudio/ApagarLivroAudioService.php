<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\Entity\Usuario;
use App\Interface\ArmazenamentoLivroInterface;
use App\Repository\LivroAudioRepository;

final readonly class ApagarLivroAudioService
{
    public function __construct(
        private ConsultarLivrosAudioService $consultarLivrosAudioService,
        private ArmazenamentoLivroInterface $armazenamentoLivro,
        private LivroAudioRepository $livroAudioRepository,
    ) {}

    public function executar(string $uuid, Usuario $usuario): void
    {
        $livro = $this->consultarLivrosAudioService->obterDoUsuario($uuid, $usuario);

        $this->armazenamentoLivro->removerLivro($uuid);
        $this->livroAudioRepository->remover($livro);
    }
}
