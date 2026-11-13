<?php

declare(strict_types=1);

namespace App\Enum;

enum FonteCapturaYoutubeMusic: string
{
    case Coletor = 'coletor';
    case Extensao = 'extensao';

    public function descricao(): string
    {
        return match ($this) {
            self::Coletor => 'Conexão por cookies',
            self::Extensao => 'Extensão do navegador',
        };
    }

    public function isColetor(): bool
    {
        return self::Coletor === $this;
    }

    public function isExtensao(): bool
    {
        return self::Extensao === $this;
    }
}
