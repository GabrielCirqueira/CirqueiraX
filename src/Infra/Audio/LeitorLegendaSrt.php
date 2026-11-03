<?php

declare(strict_types=1);

namespace App\Infra\Audio;

use App\DataObject\TrechoNarracaoDTO;

final readonly class LeitorLegendaSrt
{
    private const string PADRAO_TEMPO = '/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/';

    /**
     * @return list<TrechoNarracaoDTO>
     */
    public function ler(string $conteudo): array
    {
        $trechos = [];
        $entradas = preg_split('/\R\s*\R/u', trim($conteudo)) ?: [];

        foreach ($entradas as $entrada) {
            $linhas = array_values(array_filter(
                array_map('trim', preg_split('/\R/u', $entrada) ?: []),
                static fn(string $linha): bool => '' !== $linha,
            ));

            foreach ($linhas as $indice => $linha) {
                if (1 !== preg_match(self::PADRAO_TEMPO, $linha, $tempos)) {
                    continue;
                }

                $texto = trim(implode(' ', array_slice($linhas, $indice + 1)));
                if ('' !== $texto) {
                    $trechos[] = new TrechoNarracaoDTO(
                        inicio: $this->converterParaSegundos($tempos[1], $tempos[2], $tempos[3], $tempos[4]),
                        fim: $this->converterParaSegundos($tempos[5], $tempos[6], $tempos[7], $tempos[8]),
                        texto: $texto,
                    );
                }

                break;
            }
        }

        return $trechos;
    }

    private function converterParaSegundos(string $horas, string $minutos, string $segundos, string $milissegundos): float
    {
        return ((int) $horas * 3600) + ((int) $minutos * 60) + (int) $segundos + ((int) $milissegundos / 1000);
    }
}
