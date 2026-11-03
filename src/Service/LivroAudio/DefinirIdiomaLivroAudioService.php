<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\Entity\LivroAudio;
use App\Enum\IdiomaLivroAudio;
use App\Repository\LivroAudioBlocoRepository;
use App\Repository\LivroAudioRepository;

final readonly class DefinirIdiomaLivroAudioService
{
    private const int LIMITE_CARACTERES_AMOSTRA = 30000;

    public function __construct(
        private DetectorIdiomaTextoService $detectorIdioma,
        private LivroAudioBlocoRepository $livroAudioBlocoRepository,
        private LivroAudioRepository $livroAudioRepository,
    ) {}

    public function executar(LivroAudio $livro): IdiomaLivroAudio
    {
        $idiomaAtual = $livro->idioma();
        if (null !== $idiomaAtual) {
            return $idiomaAtual;
        }

        $amostra = '';
        foreach ($this->livroAudioBlocoRepository->listarPorLivro($livro) as $bloco) {
            $amostra .= ' ' . $bloco->texto();
            if (mb_strlen($amostra) >= self::LIMITE_CARACTERES_AMOSTRA) {
                break;
            }
        }

        $idioma = $this->detectorIdioma->detectar($amostra);
        $livro->definirIdioma($idioma);
        $this->livroAudioRepository->salvar($livro, true);

        return $idioma;
    }
}
