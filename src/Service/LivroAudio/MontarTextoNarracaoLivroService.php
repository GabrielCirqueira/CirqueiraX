<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\DataObject\LinhaPdfDTO;
use App\DataObject\PaginaPdfDTO;
use App\Enum\ModoNotasLivroAudio;

final readonly class MontarTextoNarracaoLivroService
{
    private const float LIMITE_ZONA_CABECALHO = 0.1;
    private const float LIMITE_ZONA_RODAPE = 0.92;
    private const int MINIMO_PAGINAS_REPETIDAS = 3;
    private const float PROPORCAO_TITULO = 1.2;
    private const float PROPORCAO_NOTA_RODAPE = 0.88;
    private const float INICIO_ZONA_NOTA_RODAPE = 0.55;
    private const string PADRAO_TITULO_NOTAS = '/^(notas?|notes?|endnotes|footnotes)(\s+(e\s+coment[aá]rios|do\s+(autor|tradutor|editor|cap[ií]tulo)|de\s+rodap[eé]|finais|and\s+comments))?\s*:?$/iu';
    private const string PADRAO_TITULO_CAPITULO = '/^(cap[ií]tulo|chapter|parte|part)\s+([IVXLCDM]+|\d+)\b/iu';
    private const string PADRAO_MARCADOR_NOTA = '/\s?[\(\[]\d{1,3}[\)\]]/u';
    private const string PADRAO_INICIO_NOTA = '/^[\(\[]?(\d{1,3})[\)\]]\.?\s*/u';
    private const string PADRAO_ESPACO_ANTES_PONTUACAO = '/\s+([,.;:!?])/u';
    private const string PADRAO_LETRA_OU_NUMERO = '/[\p{L}\p{N}]/u';
    private const string PADRAO_NAO_LETRAS = '/[^\p{L}]+/u';
    private const string PADRAO_FIM_TITULO = '/[.!?:;]$/u';
    private const string TITULO_NOTAS_MOVIDAS = 'Notas.';

    /**
     * @param list<PaginaPdfDTO> $paginas
     *
     * @return array<int, string>
     */
    public function montar(array $paginas, ModoNotasLivroAudio $modo): array
    {
        $alturaTexto = $this->calcularAlturaTexto($paginas);
        $chavesRepetidas = $this->identificarLinhasRepetidas($paginas);
        $textos = [];
        $notasPendentes = [];
        $emSecaoNotas = false;
        $ultimaPagina = null;

        foreach ($paginas as $pagina) {
            $linhas = array_values(array_filter(
                $pagina->linhas,
                fn(LinhaPdfDTO $linha): bool => !$this->ehCabecalhoOuRodape($linha, $pagina, $chavesRepetidas),
            ));
            $inicioNotasRodape = $this->localizarNotasDeRodape($linhas, $pagina, $alturaTexto);
            $saida = [];
            $indicesTitulo = [];
            $ultimoTitulo = null;

            foreach ($linhas as $indice => $linha) {
                $texto = $modo->removeMarcadores() ? $linha->textoSemSobrescritos() : $linha->texto();
                if (1 !== preg_match(self::PADRAO_LETRA_OU_NUMERO, $texto)) {
                    continue;
                }

                if ($indice >= $inicioNotasRodape) {
                    if (ModoNotasLivroAudio::NORMAL === $modo) {
                        $saida[] = $texto;
                    } elseif (ModoNotasLivroAudio::FIM_CAPITULO === $modo) {
                        $notasPendentes[] = $this->formatarNota($texto);
                    }

                    continue;
                }

                $ehTitulo = null !== $alturaTexto && $linha->altura() >= $alturaTexto * self::PROPORCAO_TITULO;
                $ehTituloNotas = $this->ehTituloNotas($linha, $linhas[$indice + 1] ?? null, $ehTitulo);
                $iniciaCapitulo = $ehTitulo || 1 === preg_match(self::PADRAO_TITULO_CAPITULO, $linha->texto());

                if ($ehTituloNotas) {
                    $emSecaoNotas = true;
                } elseif ($iniciaCapitulo) {
                    $emSecaoNotas = false;

                    if (ModoNotasLivroAudio::FIM_CAPITULO === $modo && [] !== $notasPendentes) {
                        array_push($saida, self::TITULO_NOTAS_MOVIDAS, ...$notasPendentes);
                        $notasPendentes = [];
                    }
                }

                if ($emSecaoNotas && ModoNotasLivroAudio::PULAR === $modo) {
                    continue;
                }

                if ($emSecaoNotas && !$ehTituloNotas && ModoNotasLivroAudio::FIM_CAPITULO === $modo) {
                    $texto = $this->formatarNota($texto);
                } elseif (!$emSecaoNotas && $modo->removeMarcadores()) {
                    $texto = trim((string) preg_replace(
                        [self::PADRAO_MARCADOR_NOTA, self::PADRAO_ESPACO_ANTES_PONTUACAO],
                        ['', '$1'],
                        $texto,
                    ));
                }

                if ('' === $texto) {
                    continue;
                }

                if (!$ehTitulo && !$ehTituloNotas) {
                    $saida[] = $texto;
                    $ultimoTitulo = null;

                    continue;
                }

                $continuaTitulo = null !== $ultimoTitulo
                    && $ultimoTitulo['bloco'] === $linha->bloco
                    && $ultimoTitulo['indice'] === count($saida) - 1;

                if ($continuaTitulo) {
                    $saida[$ultimoTitulo['indice']] .= ' ' . $texto;
                } else {
                    $saida[] = $texto;
                    $indicesTitulo[] = count($saida) - 1;
                }

                $ultimoTitulo = ['bloco' => $linha->bloco, 'indice' => count($saida) - 1];
            }

            foreach ($indicesTitulo as $indiceTitulo) {
                if (1 !== preg_match(self::PADRAO_FIM_TITULO, $saida[$indiceTitulo])) {
                    $saida[$indiceTitulo] .= '.';
                }
            }

            $textos[$pagina->numero] = implode("\n", $saida);
            $ultimaPagina = $pagina->numero;
        }

        if (null !== $ultimaPagina && [] !== $notasPendentes) {
            $textos[$ultimaPagina] = trim(implode("\n", [$textos[$ultimaPagina], self::TITULO_NOTAS_MOVIDAS, ...$notasPendentes]));
        }

        return $textos;
    }

    /**
     * @param list<PaginaPdfDTO> $paginas
     */
    private function calcularAlturaTexto(array $paginas): ?float
    {
        $pesos = [];
        foreach ($paginas as $pagina) {
            foreach ($pagina->linhas as $linha) {
                $chave = (string) round($linha->altura(), 1);
                $pesos[$chave] = ($pesos[$chave] ?? 0) + mb_strlen($linha->texto());
            }
        }

        if ([] === $pesos) {
            return null;
        }

        arsort($pesos);
        $altura = (float) array_key_first($pesos);

        return $altura > 0 ? $altura : null;
    }

    /**
     * @param list<PaginaPdfDTO> $paginas
     *
     * @return array<string, true>
     */
    private function identificarLinhasRepetidas(array $paginas): array
    {
        $paginasPorChave = [];
        foreach ($paginas as $pagina) {
            foreach ($pagina->linhas as $linha) {
                if (!$this->estaNaZonaDeMargem($linha, $pagina)) {
                    continue;
                }

                $paginasPorChave[$this->chaveDaLinha($linha)][$pagina->numero] = true;
            }
        }

        $repetidas = [];
        foreach ($paginasPorChave as $chave => $paginasDaChave) {
            if ('' !== $chave && count($paginasDaChave) >= self::MINIMO_PAGINAS_REPETIDAS) {
                $repetidas[$chave] = true;
            }
        }

        return $repetidas;
    }

    /**
     * @param array<string, true> $chavesRepetidas
     */
    private function ehCabecalhoOuRodape(LinhaPdfDTO $linha, PaginaPdfDTO $pagina, array $chavesRepetidas): bool
    {
        if (!$this->estaNaZonaDeMargem($linha, $pagina)) {
            return false;
        }

        $chave = $this->chaveDaLinha($linha);

        return '' === $chave || isset($chavesRepetidas[$chave]);
    }

    private function estaNaZonaDeMargem(LinhaPdfDTO $linha, PaginaPdfDTO $pagina): bool
    {
        if ($pagina->altura <= 0) {
            return false;
        }

        return $linha->yMin < $pagina->altura * self::LIMITE_ZONA_CABECALHO
            || $linha->yMax > $pagina->altura * self::LIMITE_ZONA_RODAPE;
    }

    private function chaveDaLinha(LinhaPdfDTO $linha): string
    {
        return (string) preg_replace(self::PADRAO_NAO_LETRAS, '', mb_strtolower($linha->texto()));
    }

    /**
     * @param list<LinhaPdfDTO> $linhas
     */
    private function localizarNotasDeRodape(array $linhas, PaginaPdfDTO $pagina, ?float $alturaTexto): int
    {
        $total = count($linhas);
        if (null === $alturaTexto || $pagina->altura <= 0) {
            return $total;
        }

        $inicio = $total;
        for ($indice = $total - 1; $indice >= 0; --$indice) {
            $linha = $linhas[$indice];
            $pequena = $linha->altura() <= $alturaTexto * self::PROPORCAO_NOTA_RODAPE;

            if (!$pequena) {
                break;
            }

            if ($linha->yMin < $pagina->altura * self::INICIO_ZONA_NOTA_RODAPE) {
                return $total;
            }

            $inicio = $indice;
        }

        return $inicio > 0 ? $inicio : $total;
    }

    private function ehTituloNotas(LinhaPdfDTO $linha, ?LinhaPdfDTO $proximaLinha, bool $ehTitulo): bool
    {
        if (1 !== preg_match(self::PADRAO_TITULO_NOTAS, trim($linha->texto()))) {
            return false;
        }

        return $ehTitulo || (null !== $proximaLinha && 1 === preg_match(self::PADRAO_INICIO_NOTA, $proximaLinha->texto()));
    }

    private function formatarNota(string $texto): string
    {
        return (string) preg_replace(self::PADRAO_INICIO_NOTA, 'Nota $1. ', $texto);
    }
}
