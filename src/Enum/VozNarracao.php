<?php

declare(strict_types=1);

namespace App\Enum;

enum VozNarracao: string
{
    case ANTONIO = 'pt-BR-AntonioNeural';
    case FRANCISCA = 'pt-BR-FranciscaNeural';
    case THALITA = 'pt-BR-ThalitaMultilingualNeural';
    case DUARTE = 'pt-PT-DuarteNeural';
    case RAQUEL = 'pt-PT-RaquelNeural';
    case ANDREW = 'en-US-AndrewMultilingualNeural';
    case BRIAN = 'en-US-BrianMultilingualNeural';
    case AVA = 'en-US-AvaMultilingualNeural';
    case EMMA = 'en-US-EmmaMultilingualNeural';

    public function nome(): string
    {
        return match ($this) {
            self::ANTONIO => 'Antonio',
            self::FRANCISCA => 'Francisca',
            self::THALITA => 'Thalita',
            self::DUARTE => 'Duarte',
            self::RAQUEL => 'Raquel',
            self::ANDREW => 'Andrew',
            self::BRIAN => 'Brian',
            self::AVA => 'Ava',
            self::EMMA => 'Emma',
        };
    }

    public function descricao(): string
    {
        return match ($this) {
            self::ANTONIO => 'Masculina, português do Brasil',
            self::FRANCISCA => 'Feminina, português do Brasil',
            self::THALITA => 'Feminina, português do Brasil, mais expressiva',
            self::DUARTE => 'Masculina, sotaque de Portugal',
            self::RAQUEL => 'Feminina, sotaque de Portugal',
            self::ANDREW => 'Masculina, multilíngue com leve sotaque',
            self::BRIAN => 'Masculina, multilíngue com leve sotaque',
            self::AVA => 'Feminina, multilíngue com leve sotaque',
            self::EMMA => 'Feminina, multilíngue com leve sotaque',
        };
    }

    public function isMultilingue(): bool
    {
        return str_contains($this->value, 'Multilingual');
    }

    public function atendeIdioma(IdiomaLivroAudio $idioma): bool
    {
        return IdiomaLivroAudio::PT === $idioma || $this->isMultilingue();
    }

    /**
     * @return list<self>
     */
    public static function disponiveisPara(IdiomaLivroAudio $idioma): array
    {
        return array_values(array_filter(
            self::cases(),
            static fn(self $voz): bool => $voz->atendeIdioma($idioma),
        ));
    }

    public static function nomeDe(string $voz): string
    {
        $catalogada = self::tryFrom($voz);
        if (null !== $catalogada) {
            return $catalogada->nome();
        }

        $partes = explode('-', $voz);

        return str_replace(['Multilingual', 'Neural'], '', end($partes));
    }
}
