<?php

declare(strict_types=1);

namespace App\Enum;

enum OrigemEnvioGoogleFotos: string
{
    case AUTOMATICO = 'automatico';
    case RETENTATIVA = 'retentativa';
    case REENVIO_MANUAL = 'reenvio_manual';
    case FORCADO = 'forcado';

    public function descricao(): string
    {
        return match ($this) {
            self::AUTOMATICO => 'Automático',
            self::RETENTATIVA => 'Retentativa',
            self::REENVIO_MANUAL => 'Reenvio manual',
            self::FORCADO => 'Envio forçado',
        };
    }

    public static function resolver(bool $forcado, bool $reenvioManual, int $tentativa): self
    {
        if ($forcado) {
            return self::FORCADO;
        }

        if ($reenvioManual) {
            return self::REENVIO_MANUAL;
        }

        if ($tentativa > 1) {
            return self::RETENTATIVA;
        }

        return self::AUTOMATICO;
    }
}
