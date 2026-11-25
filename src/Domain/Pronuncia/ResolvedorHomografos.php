<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

final class ResolvedorHomografos
{
    private const array HOMOGRAFOS = [
        'read' => [
            'padrao' => ['R', 'IY1', 'D'],
            'alternativa' => ['R', 'EH1', 'D'],
            'gatilhos' => ['have', 'has', 'had', "i've", "you've", "we've", "they've", "he's", "she's", 'been', 'already'],
        ],
        'live' => [
            'padrao' => ['L', 'IH1', 'V'],
            'alternativa' => ['L', 'AY1', 'V'],
            'gatilhos' => ['a', 'is', 'are', 'was', 'were', 'be', 'go', 'goes', 'went', 'watch', 'watching', 'stream'],
        ],
        'lead' => [
            'padrao' => ['L', 'IY1', 'D'],
            'alternativa' => ['L', 'EH1', 'D'],
            'gatilhos' => ['of', 'made', 'heavy'],
        ],
        'wind' => [
            'padrao' => ['W', 'IH1', 'N', 'D'],
            'alternativa' => ['W', 'AY1', 'N', 'D'],
            'gatilhos' => ['to', 'will', "i'll", 'please'],
        ],
        'tear' => [
            'padrao' => ['T', 'IH1', 'R'],
            'alternativa' => ['T', 'EH1', 'R'],
            'gatilhos' => ['to', 'will', "don't", 'please', 'wear', 'and'],
        ],
    ];

    /**
     * Escolhe a pronúncia de palavras escritas igual e lidas diferente (read, live, lead...) pela palavra anterior.
     *
     * @return list<string>|null
     */
    public function resolver(string $palavra, ?string $palavraAnterior): ?array
    {
        $regra = self::HOMOGRAFOS[$palavra] ?? null;
        if (null === $regra) {
            return null;
        }

        $usarAlternativa = null !== $palavraAnterior && in_array($palavraAnterior, $regra['gatilhos'], true);

        return $usarAlternativa ? $regra['alternativa'] : $regra['padrao'];
    }
}
