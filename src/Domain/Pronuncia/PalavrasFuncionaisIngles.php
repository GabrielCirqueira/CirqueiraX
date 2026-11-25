<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

final class PalavrasFuncionaisIngles
{
    private const array FUNCIONAIS = [
        'a', 'an', 'the', 'to', 'of', 'and', 'or', 'but', 'for', 'from', 'at', 'in', 'on', 'by', 'with', 'as', 'into', 'onto',
        'is', 'am', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'do', 'does', 'did', 'can', 'could', 'will',
        'would', 'shall', 'should', 'may', 'might', 'must', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
        'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'than', 'that', 'if', 'so', 'some', "i'm", "you're",
        "he's", "she's", "it's", "we're", "they're", "i'll", "you'll", "i've", "i'd", "that's", "there's",
    ];
    private const array FORMAS_FRACAS = [
        'a' => 'â', 'an' => 'ân', 'the' => 'dâ', 'to' => 'tâ', 'of' => 'âv', 'and' => 'ân', 'or' => 'âr', 'but' => 'bât',
        'for' => 'fâr', 'from' => 'frâm', 'at' => 'ât', 'can' => 'kân', 'you' => 'iâ', 'your' => 'iâr', 'are' => 'âr',
        'was' => 'uâz', 'were' => 'uâr', 'them' => 'dâm', 'him' => 'im', 'her' => 'âr', 'as' => 'âz', 'than' => 'dân',
        'some' => 'sâm', 'that' => 'dât', 'does' => 'dâz', 'has' => 'âz', 'had' => 'âd', 'should' => 'chud', 'would' => 'ud',
    ];
    private const string THE_ANTES_DE_VOGAL = 'di';

    public function isFuncional(string $palavra): bool
    {
        return in_array($palavra, self::FUNCIONAIS, true);
    }

    /**
     * Forma reduzida que o nativo usa no meio da frase: "to" vira "tâ", "and" vira "ân".
     */
    public function formaFraca(string $palavra, bool $antesDeVogal): ?string
    {
        if ('the' === $palavra && $antesDeVogal) {
            return self::THE_ANTES_DE_VOGAL;
        }

        return self::FORMAS_FRACAS[$palavra] ?? null;
    }
}
