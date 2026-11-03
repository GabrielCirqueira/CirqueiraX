<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\Enum\IdiomaLivroAudio;

final readonly class DetectorIdiomaTextoService
{
    public function detectar(string $texto): IdiomaLivroAudio
    {
        preg_match_all('/\p{L}+/u', mb_strtolower($texto), $correspondencias);
        $ocorrencias = array_count_values($correspondencias[0]);

        $idiomaDetectado = IdiomaLivroAudio::PT;
        $maiorPontuacao = 0;

        foreach (IdiomaLivroAudio::cases() as $idioma) {
            $pontuacao = 0;
            foreach ($idioma->palavrasFrequentes() as $palavra) {
                $pontuacao += $ocorrencias[$palavra] ?? 0;
            }

            if ($pontuacao > $maiorPontuacao) {
                $maiorPontuacao = $pontuacao;
                $idiomaDetectado = $idioma;
            }
        }

        return $idiomaDetectado;
    }
}
