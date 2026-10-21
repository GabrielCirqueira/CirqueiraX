<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusEnvioGoogleFotos: string
{
    case ENVIANDO = 'enviando';
    case ENVIADO = 'enviado';
    case REAPROVEITADO = 'reaproveitado';
    case FALHA = 'falha';

    public function descricao(): string
    {
        return match ($this) {
            self::ENVIANDO => 'Enviando',
            self::ENVIADO => 'Enviado',
            self::REAPROVEITADO => 'Já existia no Google Fotos',
            self::FALHA => 'Falha',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn(self $status): string => $status->value, self::cases());
    }

    public function isFalha(): bool
    {
        return self::FALHA === $this;
    }
}
