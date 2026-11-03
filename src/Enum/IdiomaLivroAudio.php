<?php

declare(strict_types=1);

namespace App\Enum;

enum IdiomaLivroAudio: string
{
    case PT = 'pt';
    case EN = 'en';
    case ES = 'es';
    case FR = 'fr';
    case IT = 'it';
    case DE = 'de';

    public function descricao(): string
    {
        return match ($this) {
            self::PT => 'Português',
            self::EN => 'Inglês',
            self::ES => 'Espanhol',
            self::FR => 'Francês',
            self::IT => 'Italiano',
            self::DE => 'Alemão',
        };
    }

    public function voz(): string
    {
        return match ($this) {
            self::PT => 'pt-BR-AntonioNeural',
            self::EN => 'en-US-AndrewNeural',
            self::ES => 'es-ES-AlvaroNeural',
            self::FR => 'fr-FR-HenriNeural',
            self::IT => 'it-IT-DiegoNeural',
            self::DE => 'de-DE-ConradNeural',
        };
    }

    /**
     * @return list<string>
     */
    public function palavrasFrequentes(): array
    {
        return match ($this) {
            self::PT => ['o', 'os', 'as', 'um', 'uma', 'não', 'com', 'mais', 'foi', 'ele', 'ela', 'são', 'também', 'pelo', 'pela', 'nas', 'nos', 'você', 'está', 'isso', 'muito', 'seu', 'sua'],
            self::EN => ['the', 'and', 'of', 'to', 'in', 'that', 'is', 'was', 'he', 'for', 'it', 'with', 'his', 'on', 'be', 'at', 'by', 'this', 'had', 'not', 'are', 'but', 'from', 'they', 'have', 'which'],
            self::ES => ['el', 'la', 'los', 'las', 'una', 'y', 'del', 'por', 'con', 'es', 'su', 'pero', 'más', 'fue', 'este', 'esta', 'también', 'muy', 'sus', 'al'],
            self::FR => ['le', 'les', 'des', 'et', 'une', 'dans', 'est', 'qui', 'pour', 'pas', 'sur', 'au', 'avec', 'sont', 'cette', 'nous', 'vous', 'mais', 'du'],
            self::IT => ['il', 'gli', 'della', 'che', 'per', 'una', 'sono', 'con', 'non', 'più', 'anche', 'come', 'degli', 'nel', 'alla', 'di', 'e'],
            self::DE => ['der', 'die', 'und', 'das', 'ist', 'nicht', 'ein', 'eine', 'mit', 'auf', 'für', 'von', 'zu', 'den', 'sich', 'auch', 'dem'],
        };
    }
}
