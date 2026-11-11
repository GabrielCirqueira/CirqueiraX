<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusImportacaoYoutube: string
{
    case Enviada = 'enviada';
    case Processando = 'processando';
    case AguardandoConfirmacao = 'aguardando_confirmacao';
    case Classificando = 'classificando';
    case Concluida = 'concluida';
    case Erro = 'erro';

    public function descricao(): string
    {
        return match ($this) {
            self::Enviada => 'Enviada para processamento',
            self::Processando => 'Lendo o histórico do YouTube',
            self::AguardandoConfirmacao => 'Aguardando confirmação do custo',
            self::Classificando => 'Classificando os vídeos',
            self::Concluida => 'Importação concluída',
            self::Erro => 'Falha na importação',
        };
    }

    public function isFinalizado(): bool
    {
        return match ($this) {
            self::Concluida, self::Erro => true,
            self::Enviada, self::Processando, self::AguardandoConfirmacao, self::Classificando => false,
        };
    }

    /**
     * @return list<self>
     */
    public static function emAndamento(): array
    {
        return [self::Enviada, self::Processando, self::AguardandoConfirmacao, self::Classificando];
    }
}
