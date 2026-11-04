<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\Entity\LivroAudio;
use App\Entity\LivroAudioBloco;
use App\Repository\LivroAudioBlocoRepository;
use App\Repository\LivroAudioRepository;

final readonly class DividirLivroEmBlocosService
{
    private const int PAGINAS_POR_BLOCO_PADRAO = 3;
    private const int LIMITE_CARACTERES_BLOCO = 3500;

    public function __construct(
        private ExtrairTextoNarracaoLivroService $extrairTextoNarracao,
        private LivroAudioBlocoRepository $livroAudioBlocoRepository,
        private LivroAudioRepository $livroAudioRepository,
        private DefinirIdiomaLivroAudioService $definirIdiomaLivro,
    ) {}

    /**
     * @return list<LivroAudioBloco>
     */
    public function executar(LivroAudio $livro): array
    {
        $totalPaginas = $livro->totalPaginas();

        if ($totalPaginas <= 0) {
            return [];
        }

        $livro->iniciarExtracao();
        $this->livroAudioRepository->salvar($livro, true);

        $textos = $this->extrairTextoNarracao->executar($livro);

        $blocosCriados = [];
        $numeroBloco = 1;
        $paginaInicioBloco = 1;
        $caracteresAcumulados = 0;

        for ($pagina = 1; $pagina <= $totalPaginas; ++$pagina) {
            $caracteresAcumulados += mb_strlen($textos[$pagina] ?? '');

            $quantidadePaginas = ($pagina - $paginaInicioBloco) + 1;
            $atingiuLimitePaginas = $quantidadePaginas >= self::PAGINAS_POR_BLOCO_PADRAO;
            $atingiuLimiteCaracteres = $caracteresAcumulados >= self::LIMITE_CARACTERES_BLOCO;
            $ehUltimaPagina = $pagina === $totalPaginas;

            if ($ehUltimaPagina || $atingiuLimitePaginas || $atingiuLimiteCaracteres) {
                $bloco = new LivroAudioBloco(
                    livro: $livro,
                    numeroBloco: $numeroBloco,
                    paginaInicio: $paginaInicioBloco,
                    paginaFim: $pagina,
                    texto: $this->extrairTextoNarracao->textoDoIntervalo($textos, $paginaInicioBloco, $pagina),
                );

                $this->livroAudioBlocoRepository->salvar($bloco, false);
                $blocosCriados[] = $bloco;

                ++$numeroBloco;
                $paginaInicioBloco = $pagina + 1;
                $caracteresAcumulados = 0;
            }
        }

        $this->livroAudioBlocoRepository->flush();
        $this->definirIdiomaLivro->executar($livro);

        if (!empty($blocosCriados)) {
            $livro->iniciarGeracaoAudio();
        } else {
            $livro->marcarComoParcial();
        }

        $this->livroAudioRepository->salvar($livro, true);

        return $blocosCriados;
    }
}
