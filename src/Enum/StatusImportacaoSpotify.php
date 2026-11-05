<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusImportacaoSpotify: string
{
    case Enviada = 'enviada';
    case Processando = 'processando';
    case Concluida = 'concluida';
    case Erro = 'erro';

    public function descricao(): string
    {
        return match ($this) {
            self::Enviada => 'Enviada para processamento',
            self::Processando => 'Processando histórico',
            self::Concluida => 'Importação concluída',
            self::Erro => 'Falha na importação',
        };
    }

    public function isEnviada(): bool
    {
        return self::Enviada === $this;
    }

    public function isProcessando(): bool
    {
        return self::Processando === $this;
    }

    public function isConcluida(): bool
    {
        return self::Concluida === $this;
    }

    public function isErro(): bool
    {
        return self::Erro === $this;
    }

    public function isFinalizado(): bool
    {
        return match ($this) {
            self::Concluida, self::Erro => true,
            self::Enviada, self::Processando => false,
        };
    }
}
