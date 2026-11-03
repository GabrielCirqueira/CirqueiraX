<?php

declare(strict_types=1);

namespace App\Infra\Audio;

use App\DataObject\PalavraNarracaoDTO;
use App\DataObject\TrechoNarracaoDTO;

final readonly class AgrupadorPalavrasNarracao
{
    private const string PADRAO_SEPARADOR_FRASES = '/(?<=[.!?…])\s+|\R+/u';
    private const int DISTANCIA_MAXIMA_BUSCA = 300;

    /**
     * @param list<PalavraNarracaoDTO> $palavras
     *
     * @return list<TrechoNarracaoDTO>
     */
    public function agrupar(string $texto, array $palavras): array
    {
        $frases = $this->separarFrases($texto);
        if ([] === $frases || [] === $palavras) {
            return [];
        }

        $grupos = array_fill(0, count($frases), []);
        $ultimaFrase = count($frases) - 1;
        $indiceFrase = 0;
        $cursor = 0;

        foreach ($palavras as $palavra) {
            $posicao = '' !== $palavra->texto ? strpos($texto, $palavra->texto, $cursor) : false;

            if (false !== $posicao && $posicao - $cursor <= self::DISTANCIA_MAXIMA_BUSCA) {
                $cursor = $posicao + strlen($palavra->texto);

                while ($indiceFrase < $ultimaFrase && $posicao >= $frases[$indiceFrase]['fim']) {
                    ++$indiceFrase;
                }
            }

            $grupos[$indiceFrase][] = $palavra;
        }

        $trechos = [];
        foreach ($grupos as $indice => $grupo) {
            $primeira = $grupo[0] ?? null;
            $ultima = $grupo[count($grupo) - 1] ?? null;
            if (null === $primeira || null === $ultima) {
                continue;
            }

            $trechos[] = new TrechoNarracaoDTO(
                inicio: $primeira->inicio,
                fim: $ultima->fim,
                texto: $frases[$indice]['texto'],
                palavras: $grupo,
            );
        }

        return $trechos;
    }

    /**
     * @return list<array{texto: string, fim: int}>
     */
    private function separarFrases(string $texto): array
    {
        $partes = preg_split(self::PADRAO_SEPARADOR_FRASES, $texto, -1, PREG_SPLIT_OFFSET_CAPTURE | PREG_SPLIT_NO_EMPTY) ?: [];
        $frases = [];

        foreach ($partes as [$parte, $inicio]) {
            $textoFrase = trim($parte);
            if ('' === $textoFrase) {
                continue;
            }

            $frases[] = [
                'texto' => $textoFrase,
                'fim' => $inicio + strlen($parte),
            ];
        }

        return $frases;
    }
}
