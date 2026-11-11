<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusContaYoutubeMusic: string
{
    case Conectada = 'conectada';
    case Reconectar = 'reconectar';
    case Desconectada = 'desconectada';

    public function descricao(): string
    {
        return match ($this) {
            self::Conectada => 'Conectada',
            self::Reconectar => 'Requer reconexão',
            self::Desconectada => 'Desconectada',
        };
    }

    public function isConectada(): bool
    {
        return self::Conectada === $this;
    }

    public function isReconectar(): bool
    {
        return self::Reconectar === $this;
    }

    public function isDesconectada(): bool
    {
        return self::Desconectada === $this;
    }
}
