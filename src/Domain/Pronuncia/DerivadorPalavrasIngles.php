<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

final class DerivadorPalavrasIngles
{
    private const array SUFIXOS = [
        "'s", 'ies', 'ied', 'ily', 'ness', 'less', 'ment', 'able', 'ing', 'ers', 'est', 'ful', 'ish', 'ed', 'es', 'er', 'ly', 's',
    ];
    private const array SUFIXOS_TROCAM_Y = ['ies', 'ied', 'ily'];
    private const array SONS_FIXOS = [
        'ing' => ['IH0', 'NG'], 'ly' => ['L', 'IY0'], 'ily' => ['L', 'IY0'], 'ness' => ['N', 'AH0', 'S'],
        'less' => ['L', 'AH0', 'S'], 'ful' => ['F', 'AH0', 'L'], 'ment' => ['M', 'AH0', 'N', 'T'],
        'able' => ['AH0', 'B', 'AH0', 'L'], 'er' => ['ER0'], 'ers' => ['ER0', 'Z'], 'est' => ['AH0', 'S', 'T'],
        'ish' => ['IH0', 'SH'], 'ies' => ['Z'], 'ied' => ['D'],
    ];
    private const array PREFIXOS = [
        'under' => ['AH2', 'N', 'D', 'ER0'], 'over' => ['OW2', 'V', 'ER0'], 'out' => ['AW2', 'T'],
        'dis' => ['D', 'IH0', 'S'], 'mis' => ['M', 'IH0', 'S'], 'non' => ['N', 'AA2', 'N'],
        'pre' => ['P', 'R', 'IY0'], 'un' => ['AH0', 'N'], 're' => ['R', 'IY0'],
    ];
    private const int TAMANHO_MINIMO_BASE = 3;
    private const int TAMANHO_MINIMO_PARTE_COMPOSTA = 3;

    /**
     * Todas as palavras-base que a derivação pode consultar, para buscar o dicionário numa consulta só.
     *
     * @return list<string>
     */
    public function candidatos(string $palavra): array
    {
        $candidatos = $this->basesPorSufixo($palavra);

        foreach ($this->restosPorPrefixo($palavra) as $resto) {
            $candidatos = [...$candidatos, $resto, ...$this->basesPorSufixo($resto)];
        }

        foreach ($this->divisoesCompostas($palavra) as [$esquerda, $direita]) {
            $candidatos = [...$candidatos, $esquerda, $direita];
        }

        return array_values(array_unique($candidatos));
    }

    /**
     * Monta os fonemas de uma palavra fora do dicionário a partir de outra conhecida: plural, passado, -ing, -ly, prefixos e palavras compostas.
     *
     * @param \Closure(string): (list<string>|null) $buscar
     *
     * @return list<string>|null
     */
    public function derivar(string $palavra, \Closure $buscar): ?array
    {
        $porSufixo = $this->derivarPorSufixo($palavra, $buscar);
        if (null !== $porSufixo) {
            return $porSufixo;
        }

        foreach (self::PREFIXOS as $prefixo => $som) {
            if (!$this->isPrefixoValido($palavra, $prefixo)) {
                continue;
            }

            $resto = substr($palavra, strlen($prefixo));
            $fonemasResto = $buscar($resto) ?? $this->derivarPorSufixo($resto, $buscar);
            if (null !== $fonemasResto) {
                return [...$som, ...$fonemasResto];
            }
        }

        return $this->derivarComposta($palavra, $buscar);
    }

    /**
     * @param \Closure(string): (list<string>|null) $buscar
     *
     * @return list<string>|null
     */
    private function derivarPorSufixo(string $palavra, \Closure $buscar): ?array
    {
        foreach (self::SUFIXOS as $sufixo) {
            if (!$this->isSufixoValido($palavra, $sufixo)) {
                continue;
            }

            foreach ($this->basesDoSufixo($palavra, $sufixo) as $base) {
                $fonemasBase = $buscar($base);
                if (null !== $fonemasBase && [] !== $fonemasBase) {
                    return [...$fonemasBase, ...$this->somDoSufixo($sufixo, $fonemasBase)];
                }
            }
        }

        return null;
    }

    /**
     * @param \Closure(string): (list<string>|null) $buscar
     *
     * @return list<string>|null
     */
    private function derivarComposta(string $palavra, \Closure $buscar): ?array
    {
        foreach ($this->divisoesCompostas($palavra) as [$esquerda, $direita]) {
            $fonemasEsquerda = $buscar($esquerda);
            $fonemasDireita = $buscar($direita);
            if (null !== $fonemasEsquerda && null !== $fonemasDireita) {
                return [...$fonemasEsquerda, ...FonemasIngles::rebaixarTonicas($fonemasDireita)];
            }
        }

        return null;
    }

    /**
     * @return list<string>
     */
    private function basesPorSufixo(string $palavra): array
    {
        $bases = [];
        foreach (self::SUFIXOS as $sufixo) {
            if ($this->isSufixoValido($palavra, $sufixo)) {
                $bases = [...$bases, ...$this->basesDoSufixo($palavra, $sufixo)];
            }
        }

        return $bases;
    }

    /**
     * @return list<string>
     */
    private function restosPorPrefixo(string $palavra): array
    {
        $restos = [];
        foreach (array_keys(self::PREFIXOS) as $prefixo) {
            if ($this->isPrefixoValido($palavra, $prefixo)) {
                $restos[] = substr($palavra, strlen($prefixo));
            }
        }

        return $restos;
    }

    /**
     * @return list<array{0: string, 1: string}>
     */
    private function divisoesCompostas(string $palavra): array
    {
        $divisoes = [];
        $ultimoCorte = strlen($palavra) - self::TAMANHO_MINIMO_PARTE_COMPOSTA;
        for ($corte = $ultimoCorte; $corte >= self::TAMANHO_MINIMO_PARTE_COMPOSTA; --$corte) {
            $divisoes[] = [substr($palavra, 0, $corte), substr($palavra, $corte)];
        }

        return $divisoes;
    }

    private function isSufixoValido(string $palavra, string $sufixo): bool
    {
        return str_ends_with($palavra, $sufixo) && strlen($palavra) - strlen($sufixo) >= self::TAMANHO_MINIMO_BASE - 1;
    }

    private function isPrefixoValido(string $palavra, string $prefixo): bool
    {
        return str_starts_with($palavra, $prefixo) && strlen($palavra) - strlen($prefixo) >= self::TAMANHO_MINIMO_BASE;
    }

    /**
     * @return list<string>
     */
    private function basesDoSufixo(string $palavra, string $sufixo): array
    {
        $raiz = substr($palavra, 0, -strlen($sufixo));
        if (in_array($sufixo, self::SUFIXOS_TROCAM_Y, true)) {
            return [$raiz.'y'];
        }

        $bases = [$raiz, $raiz.'e'];
        $tamanho = strlen($raiz);
        if ($tamanho >= 2 && $raiz[$tamanho - 1] === $raiz[$tamanho - 2]) {
            $bases[] = substr($raiz, 0, -1);
        }

        return array_values(array_filter($bases, static fn (string $base): bool => strlen($base) >= self::TAMANHO_MINIMO_BASE));
    }

    /**
     * @param list<string> $fonemasBase
     *
     * @return list<string>
     */
    private function somDoSufixo(string $sufixo, array $fonemasBase): array
    {
        if (isset(self::SONS_FIXOS[$sufixo])) {
            return self::SONS_FIXOS[$sufixo];
        }

        $ultimo = $fonemasBase[array_key_last($fonemasBase)];

        return match ($sufixo) {
            'ed' => $this->somPassado($ultimo),
            default => $this->somPlural($ultimo),
        };
    }

    /**
     * @return list<string>
     */
    private function somPassado(string $ultimo): array
    {
        if (in_array(FonemasIngles::base($ultimo), ['T', 'D'], true)) {
            return ['IH0', 'D'];
        }

        return FonemasIngles::isSurda($ultimo) || in_array(FonemasIngles::base($ultimo), ['S', 'SH', 'CH'], true) ? ['T'] : ['D'];
    }

    /**
     * @return list<string>
     */
    private function somPlural(string $ultimo): array
    {
        if (FonemasIngles::isSibilante($ultimo)) {
            return ['IH0', 'Z'];
        }

        return FonemasIngles::isSurda($ultimo) ? ['S'] : ['Z'];
    }
}
