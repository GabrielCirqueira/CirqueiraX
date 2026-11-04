<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

final readonly class AplicarPronunciasService
{
    /**
     * @param list<array{de: string, para: string}> $pronuncias
     */
    public function aplicar(string $texto, array $pronuncias): string
    {
        $substituicoes = [];
        foreach ($pronuncias as $pronuncia) {
            $substituicoes[mb_strtolower($pronuncia['de'])] = $pronuncia['para'];
        }

        if ([] === $substituicoes) {
            return $texto;
        }

        $termos = array_keys($substituicoes);
        usort($termos, static fn(string $a, string $b): int => mb_strlen($b) <=> mb_strlen($a));
        $alternativas = implode('|', array_map(static fn(string $termo): string => preg_quote($termo, '/'), $termos));
        $padrao = sprintf('/(?<![\p{L}\p{N}])(?:%s)(?![\p{L}\p{N}])/iu', $alternativas);

        return (string) preg_replace_callback(
            $padrao,
            static fn(array $correspondencia): string => $substituicoes[mb_strtolower($correspondencia[0])] ?? $correspondencia[0],
            $texto,
        );
    }
}
