<?php

declare(strict_types=1);

namespace App\Enum;

enum OrigemMedia: string
{
    case PRINT_EMPRESA = 'print_empresa';
    case PRINT_PESSOAL = 'print_pessoal';
    case BOT_TELEGRAM = 'bot_telegram';
    case MANUAL = 'manual';

    public function descricao(): string
    {
        return match ($this) {
            self::PRINT_EMPRESA => 'Agente Print Empresa',
            self::PRINT_PESSOAL => 'Agente Print Pessoal',
            self::BOT_TELEGRAM => 'Bot de Download Telegram',
            self::MANUAL => 'Upload Manual',
        };
    }
}
