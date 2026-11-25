<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

final class FonemasIngles
{
    public const string TONICA = '1';
    public const string SECUNDARIA = '2';
    public const string ATONA = '0';

    private const array VOGAIS = ['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'];
    private const array SURDAS = ['P', 'T', 'K', 'F', 'TH'];
    private const array SIBILANTES = ['S', 'Z', 'SH', 'ZH', 'CH', 'JH'];
    private const string DIGITOS_ACENTO = '012';

    public static function base(string $fonema): string
    {
        return rtrim($fonema, self::DIGITOS_ACENTO);
    }

    public static function acento(string $fonema): string
    {
        $ultimo = substr($fonema, -1);

        return ctype_digit($ultimo) ? $ultimo : self::ATONA;
    }

    public static function isVogal(string $fonema): bool
    {
        return in_array(self::base($fonema), self::VOGAIS, true);
    }

    public static function isTonica(string $fonema): bool
    {
        return self::isVogal($fonema) && self::TONICA === self::acento($fonema);
    }

    public static function isSurda(string $fonema): bool
    {
        return in_array(self::base($fonema), self::SURDAS, true);
    }

    public static function isSibilante(string $fonema): bool
    {
        return in_array(self::base($fonema), self::SIBILANTES, true);
    }

    /**
     * @param list<string> $fonemas
     *
     * @return list<string>
     */
    public static function rebaixarTonicas(array $fonemas): array
    {
        return array_map(
            static fn (string $fonema): string => self::isTonica($fonema) ? self::base($fonema).self::SECUNDARIA : $fonema,
            $fonemas,
        );
    }

    /**
     * @param list<string> $fonemas
     *
     * @return list<string>
     */
    public static function garantirTonica(array $fonemas): array
    {
        foreach ($fonemas as $fonema) {
            if (self::isTonica($fonema)) {
                return $fonemas;
            }
        }

        foreach ($fonemas as $indice => $fonema) {
            if (self::isVogal($fonema)) {
                $fonemas[$indice] = self::base($fonema).self::TONICA;

                return $fonemas;
            }
        }

        return $fonemas;
    }

    /**
     * @return list<string>
     */
    public static function separar(string $fonemas): array
    {
        return array_values(array_filter(explode(' ', trim($fonemas)), static fn (string $fonema): bool => '' !== $fonema));
    }
}
