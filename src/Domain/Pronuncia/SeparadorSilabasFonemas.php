<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

final class SeparadorSilabasFonemas
{
    private const array ATAQUES_PERMITIDOS = [
        'P R', 'P L', 'B R', 'B L', 'T R', 'D R', 'K R', 'K L', 'G R', 'G L', 'F R', 'F L', 'TH R', 'SH R',
        'S P', 'S T', 'S K', 'S M', 'S N', 'S L', 'S W', 'T W', 'D W', 'K W', 'G W', 'TH W',
        'S P R', 'S P L', 'S T R', 'S K R', 'S K W',
        'P Y', 'B Y', 'K Y', 'F Y', 'M Y', 'V Y', 'HH Y', 'G Y', 'S K Y',
    ];

    /**
     * Separa os fonemas em sílabas pelo ataque máximo: entre duas vogais, a próxima sílaba leva o maior grupo de consoantes que o inglês aceita no começo de sílaba.
     *
     * @param list<string> $fonemas
     *
     * @return list<list<string>>
     */
    public function separar(array $fonemas): array
    {
        $nucleos = array_keys(array_filter($fonemas, FonemasIngles::isVogal(...)));
        if (count($nucleos) <= 1) {
            return [$fonemas];
        }

        $silabas = [];
        $inicio = 0;
        for ($indice = 0; $indice < count($nucleos) - 1; ++$indice) {
            $corte = $this->posicaoDoCorte($fonemas, $nucleos[$indice], $nucleos[$indice + 1]);
            $silabas[] = array_slice($fonemas, $inicio, $corte - $inicio);
            $inicio = $corte;
        }
        $silabas[] = array_slice($fonemas, $inicio);

        return $silabas;
    }

    /**
     * @param list<string> $fonemas
     */
    private function posicaoDoCorte(array $fonemas, int $nucleoAtual, int $proximoNucleo): int
    {
        $consoantes = array_map(FonemasIngles::base(...), array_slice($fonemas, $nucleoAtual + 1, $proximoNucleo - $nucleoAtual - 1));
        $quantidade = count($consoantes);
        if ($quantidade <= 1) {
            return $nucleoAtual + 1;
        }

        for ($tamanho = $quantidade; $tamanho >= 2; --$tamanho) {
            $ataque = implode(' ', array_slice($consoantes, $quantidade - $tamanho));
            if (in_array($ataque, self::ATAQUES_PERMITIDOS, true)) {
                return $proximoNucleo - $tamanho;
            }
        }

        return $proximoNucleo - 1;
    }
}
