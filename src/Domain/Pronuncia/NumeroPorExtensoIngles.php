<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

final class NumeroPorExtensoIngles
{
    private const array UNIDADES = [
        'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
        'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
    ];
    private const array DEZENAS = [2 => 'twenty', 3 => 'thirty', 4 => 'forty', 5 => 'fifty', 6 => 'sixty', 7 => 'seventy', 8 => 'eighty', 9 => 'ninety'];
    private const array ESCALAS = [1_000_000_000 => 'billion', 1_000_000 => 'million', 1000 => 'thousand'];
    private const int CEM = 100;
    private const int DEZ = 10;
    private const int VINTE = 20;
    private const int ANO_MINIMO = 1100;
    private const int ANO_MAXIMO = 2099;
    private const int INICIO_SECULO_21 = 2000;
    private const int FIM_DECADA_ZERO = 2010;
    private const int LIMITE = 999_999_999_999;

    /**
     * Converte um número em palavras do inglês americano. Números com cara de ano (1100–2099) são lidos como ano: 1990 = nineteen ninety.
     */
    public function converter(string $digitos): string
    {
        $numero = (int) ltrim($digitos, '0');
        if ($numero > self::LIMITE) {
            return implode(' ', array_map(fn (string $digito): string => self::UNIDADES[(int) $digito], str_split($digitos)));
        }

        if ($this->isAno($digitos, $numero)) {
            return $this->ano($numero);
        }

        return $this->porExtenso($numero);
    }

    private function isAno(string $digitos, int $numero): bool
    {
        return 4 === strlen($digitos) && $numero >= self::ANO_MINIMO && $numero <= self::ANO_MAXIMO
            && ($numero < self::INICIO_SECULO_21 || $numero >= self::FIM_DECADA_ZERO);
    }

    private function ano(int $numero): string
    {
        $inicio = intdiv($numero, self::CEM);
        $fim = $numero % self::CEM;
        if (0 === $fim) {
            return $this->porExtenso($inicio).' hundred';
        }

        $final = $fim < self::DEZ ? 'oh '.self::UNIDADES[$fim] : $this->ateCem($fim);

        return $this->porExtenso($inicio).' '.$final;
    }

    private function porExtenso(int $numero): string
    {
        if ($numero < self::CEM) {
            return $this->ateCem($numero);
        }

        foreach (self::ESCALAS as $escala => $nome) {
            if ($numero >= $escala) {
                $resto = $numero % $escala;

                return trim($this->porExtenso(intdiv($numero, $escala)).' '.$nome.($resto > 0 ? ' '.$this->porExtenso($resto) : ''));
            }
        }

        $resto = $numero % self::CEM;

        return trim(self::UNIDADES[intdiv($numero, self::CEM)].' hundred'.($resto > 0 ? ' '.$this->ateCem($resto) : ''));
    }

    private function ateCem(int $numero): string
    {
        if ($numero < self::VINTE) {
            return self::UNIDADES[$numero];
        }

        $unidade = $numero % self::DEZ;
        $dezena = self::DEZENAS[intdiv($numero, self::DEZ)];

        return 0 === $unidade ? $dezena : $dezena.' '.self::UNIDADES[$unidade];
    }
}
