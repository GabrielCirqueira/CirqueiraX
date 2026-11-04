<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\DataObject\ConfigurarNarracaoLivroDTO;
use App\Entity\LivroAudio;
use App\Entity\Usuario;
use App\Exception\LivroAudio\LivroAudioException;
use App\Repository\LivroAudioRepository;

final readonly class ConfigurarNarracaoLivroAudioService
{
    public function __construct(
        private LivroAudioRepository $livroAudioRepository,
        private RefazerNarracaoLivroAudioService $refazerNarracao,
    ) {}

    public function executar(string $uuid, ConfigurarNarracaoLivroDTO $dto, Usuario $usuario): LivroAudio
    {
        $livro = $this->livroAudioRepository->buscarDoUsuario($uuid, $usuario);
        if (null === $livro) {
            throw LivroAudioException::livroNaoEncontrado($uuid);
        }

        if ($livro->isEnviado() || $livro->isExtraindo() || 0 === $livro->totalBlocos()) {
            throw LivroAudioException::narracaoEmPreparo();
        }

        $livro->configurarNarracao($dto->modoNotas(), $dto->pronuncias());
        $this->refazerNarracao->executar($livro);

        return $livro;
    }
}
