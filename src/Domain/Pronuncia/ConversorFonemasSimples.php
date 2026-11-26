<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

final readonly class ConversorFonemasSimples
{
    private const array PALAVRAS_PRONTAS = [
        'the' => 'de',
        'a' => 'a',
        'an' => 'en',
        'to' => 'tu',
        'you' => 'iu',
        'your' => 'ior',
        "you're" => 'ior',
        'and' => 'end',
        'of' => 'ofi',
        'are' => 'ar',
        'i' => 'ai',
        "i'm" => 'aim',
        'is' => 'iz',
        'can' => 'quen',
        'for' => 'for',
        'from' => 'from',
        'or' => 'or',
    ];

    private const array VOGAIS = [
        'AA' => 'o',
        'AE' => 'e',
        'AH' => 'a',
        'AO' => 'o',
        'AW' => 'au',
        'AY' => 'ai',
        'EH' => 'e',
        'ER' => 'er',
        'EY' => 'ei',
        'IH' => 'i',
        'IY' => 'i',
        'OW' => 'ou',
        'OY' => 'ói',
        'UH' => 'u',
        'UW' => 'u',
    ];

    private const array VOGAIS_ABERTAS_TONICAS = ['AA' => 'ó', 'AO' => 'ó'];

    private const array CONSOANTES = [
        'B' => 'b',
        'D' => 'd',
        'DH' => 'd',
        'F' => 'f',
        'JH' => 'dj',
        'L' => 'l',
        'M' => 'm',
        'N' => 'n',
        'NG' => 'n',
        'P' => 'p',
        'R' => 'r',
        'S' => 's',
        'SH' => 'ch',
        'T' => 't',
        'TH' => 't',
        'V' => 'v',
        'W' => 'u',
        'Y' => 'i',
        'Z' => 'z',
        'ZH' => 'j',
    ];

    private const array FINAIS_SEM_VOGAL_DE_APOIO = ['R', 'N', 'NG', 'Z', 'L', 'M', 'S'];
    private const array OCLUSIVAS = ['P', 'B', 'T', 'D', 'K', 'G'];
    private const array VOGAIS_DE_SOM_E_OU_I = ['AE', 'EH', 'ER', 'EY', 'IH', 'IY'];
    private const array VOGAIS_DE_SOM_I = ['IH', 'IY'];
    private const array CONSOANTES_DE_ENCONTRO = ['L', 'R'];
    private const string VOGAL_DE_APOIO = 'i';
    private const string L_FINAL = 'u';
    private const string R_ENTRE_VOGAIS = 'rr';
    private const string R_DO_H = 'r';
    private const string CH_ANTES_DE_I = 't';
    private const string CH = 'tch';
    private const string T_BATIDO = 'r';
    private const string K_SUAVE = 'qu';
    private const string K_DURO = 'c';
    private const string K_ANTES_DE_CONSOANTE = 'k';
    private const string G_SUAVE = 'gu';
    private const string G_DURO = 'g';

    /**
     * Escreve a palavra do jeito que um brasileiro lê sem esforço: sem maiúsculas nem hífen, com "i" de apoio no fim ("good" → gudi), "ch" como "ti" ("much" → mati), "h" como "r" ("how" → rau) e "i" antes de "s" + consoante ("speak" → ispiqui).
     *
     * @param list<string> $fonemas
     */
    public function converter(array $fonemas, string $chave): string
    {
        $pronta = self::PALAVRAS_PRONTAS[$chave] ?? null;
        if (null !== $pronta) {
            return $pronta;
        }

        $bases = array_map(FonemasIngles::base(...), $fonemas);
        $total = count($bases);
        $ultimaVogal = $this->indiceUltimaVogal($fonemas);
        $texto = $this->prefixoS($bases);

        for ($indice = 0; $indice < $total; ++$indice) {
            $texto .= FonemasIngles::isVogal($fonemas[$indice])
                ? $this->vogal($fonemas[$indice])
                : $this->consoante($fonemas, $bases, $indice, $ultimaVogal);
        }

        return $this->semVogaisDobradas($texto);
    }

    /**
     * Para palavras corrigidas à mão (sem fonemas): tira hífens e maiúsculas da pronúncia revisada.
     */
    public function deFigurada(string $figurada): string
    {
        return mb_strtolower(str_replace('-', '', $figurada));
    }

    private function vogal(string $fonema): string
    {
        $base = FonemasIngles::base($fonema);
        $tonica = FonemasIngles::ATONA !== FonemasIngles::acento($fonema);

        return $tonica && isset(self::VOGAIS_ABERTAS_TONICAS[$base]) ? self::VOGAIS_ABERTAS_TONICAS[$base] : self::VOGAIS[$base];
    }

    /**
     * @param list<string> $fonemas
     * @param list<string> $bases
     */
    private function consoante(array $fonemas, array $bases, int $indice, ?int $ultimaVogal): string
    {
        $base = $bases[$indice];
        $seguinte = $bases[$indice + 1] ?? null;
        $final = null !== $ultimaVogal && $indice > $ultimaVogal;
        $ultimo = $indice === count($bases) - 1;
        $apoio = $ultimo ? $this->vogalDeApoio($fonemas, $bases, $ultimaVogal) : '';

        return match ($base) {
            'HH' => $this->hInicialOuEntreVogais($fonemas, $indice),
            'CH' => ('' !== $apoio || in_array($seguinte, self::VOGAIS_DE_SOM_I, true) ? self::CH_ANTES_DE_I : self::CH).$apoio,
            'K' => $this->k($seguinte, $apoio).$apoio,
            'G' => (in_array($seguinte, self::VOGAIS_DE_SOM_E_OU_I, true) || '' !== $apoio ? self::G_SUAVE : self::G_DURO).$apoio,
            'T' => ($this->isTBatido($fonemas, $indice) ? self::T_BATIDO : self::CONSOANTES['T']).$apoio,
            'L' => $final && $ultimo ? self::L_FINAL : self::CONSOANTES['L'],
            'S' => $this->s($bases, $indice, $ultimo),
            default => (self::CONSOANTES[$base] ?? '').$apoio,
        };
    }

    private function k(?string $seguinte, string $apoio): string
    {
        if ('' !== $apoio || in_array($seguinte, self::VOGAIS_DE_SOM_E_OU_I, true)) {
            return self::K_SUAVE;
        }

        return null === $seguinte || isset(self::VOGAIS[$seguinte]) || in_array($seguinte, self::CONSOANTES_DE_ENCONTRO, true) ? self::K_DURO : self::K_ANTES_DE_CONSOANTE;
    }

    /**
     * @param list<string> $bases
     */
    private function s(array $bases, int $indice, bool $ultimo): string
    {
        $anterior = $bases[$indice - 1] ?? null;

        return $ultimo && in_array($anterior, self::OCLUSIVAS, true) ? self::VOGAL_DE_APOIO.self::CONSOANTES['S'] : self::CONSOANTES['S'];
    }

    /**
     * @param list<string> $fonemas
     * @param list<string> $bases
     */
    private function vogalDeApoio(array $fonemas, array $bases, ?int $ultimaVogal): string
    {
        $base = $bases[array_key_last($bases)];
        if (null === $ultimaVogal || isset(self::VOGAIS[$base])) {
            return '';
        }

        if ('M' === $base) {
            return FonemasIngles::TONICA === FonemasIngles::acento($fonemas[$ultimaVogal]) ? self::VOGAL_DE_APOIO : '';
        }

        return in_array($base, self::FINAIS_SEM_VOGAL_DE_APOIO, true) ? '' : self::VOGAL_DE_APOIO;
    }

    /**
     * @param list<string> $fonemas
     */
    private function hInicialOuEntreVogais(array $fonemas, int $indice): string
    {
        $anterior = $fonemas[$indice - 1] ?? null;

        return null !== $anterior && FonemasIngles::isVogal($anterior) ? self::R_ENTRE_VOGAIS : self::R_DO_H;
    }

    /**
     * @param list<string> $fonemas
     */
    private function isTBatido(array $fonemas, int $indice): bool
    {
        $anterior = $fonemas[$indice - 1] ?? null;
        $seguinte = $fonemas[$indice + 1] ?? null;
        $anteriorPermite = null !== $anterior && (FonemasIngles::isVogal($anterior) || 'R' === FonemasIngles::base($anterior));

        return $anteriorPermite
            && null !== $seguinte
            && FonemasIngles::isVogal($seguinte)
            && FonemasIngles::ATONA === FonemasIngles::acento($seguinte);
    }

    /**
     * @param list<string> $bases
     */
    private function prefixoS(array $bases): string
    {
        $segundo = $bases[1] ?? null;

        return 'S' === ($bases[0] ?? null) && null !== $segundo && !isset(self::VOGAIS[$segundo]) ? self::VOGAL_DE_APOIO : '';
    }

    /**
     * @param list<string> $fonemas
     */
    private function indiceUltimaVogal(array $fonemas): ?int
    {
        $ultima = null;
        foreach ($fonemas as $indice => $fonema) {
            $ultima = FonemasIngles::isVogal($fonema) ? $indice : $ultima;
        }

        return $ultima;
    }

    private function semVogaisDobradas(string $texto): string
    {
        return (string) preg_replace('/([iu])\1+/u', '$1', $texto);
    }
}
