<?php

declare(strict_types=1);

namespace App\Enum;

enum FonteReproducaoSpotify: string
{
    case Api = 'api';
    case ImportacaoBasica = 'importacao_basica';
    case ImportacaoEstendida = 'importacao_estendida';

    public function descricao(): string
    {
        return match ($this) {
            self::Api => 'API do Spotify',
            self::ImportacaoBasica => 'Importação Básica',
            self::ImportacaoEstendida => 'Importação Estendida',
        };
    }

    public function isTempoExato(): bool
    {
        return match ($this) {
            self::ImportacaoBasica, self::ImportacaoEstendida => true,
            self::Api => false,
        };
    }

    public function prioridade(): int
    {
        return match ($this) {
            self::ImportacaoEstendida => 3,
            self::ImportacaoBasica => 2,
            self::Api => 1,
        };
    }

    public function isApi(): bool
    {
        return self::Api === $this;
    }

    public function isImportacaoBasica(): bool
    {
        return self::ImportacaoBasica === $this;
    }

    public function isImportacaoEstendida(): bool
    {
        return self::ImportacaoEstendida === $this;
    }
}
