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
    case FABER = 'piper-pt_BR-faber-medium';
    case LESSAC = 'piper-en_US-lessac-medium';

    public const string PREFIXO_PIPER = 'piper-';

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
            self::FABER => 'Faber',
            self::LESSAC => 'Lessac',
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
            self::FABER => 'Masculina, português do Brasil. Roda no próprio servidor (Piper), sem depender da Microsoft',
            self::LESSAC => 'Feminina, inglês. Roda no próprio servidor (Piper), sem depender da Microsoft',
        };
    }

    public function isMultilingue(): bool
    {
        return str_contains($this->value, 'Multilingual');
    }

    public function isPiper(): bool
    {
        return str_starts_with($this->value, self::PREFIXO_PIPER);
    }

    public function idiomaPiper(): ?IdiomaLivroAudio
    {
        return match ($this) {
            self::FABER => IdiomaLivroAudio::PT,
            self::LESSAC => IdiomaLivroAudio::EN,
            default => null,
        };
    }

    public function atendeIdioma(IdiomaLivroAudio $idioma): bool
    {
        if ($this->isPiper()) {
            return $this->idiomaPiper() === $idioma;
        }

        return IdiomaLivroAudio::PT === $idioma || $this->isMultilingue();
    }

    public static function motorDe(string $voz): string
    {
        return str_starts_with($voz, self::PREFIXO_PIPER) ? 'piper' : 'edge';
    }

    public static function vozPiperPara(IdiomaLivroAudio $idioma): ?self
    {
        foreach (self::cases() as $voz) {
            if ($voz->isPiper() && $voz->idiomaPiper() === $idioma) {
                return $voz;
            }
        }

        return null;
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

        if (str_starts_with($voz, self::PREFIXO_PIPER)) {
            $partes = explode('-', substr($voz, strlen(self::PREFIXO_PIPER)));

            return ucfirst($partes[1] ?? $voz);
        }

        $partes = explode('-', $voz);

        return str_replace(['Multilingual', 'Neural'], '', end($partes));
    }
}
