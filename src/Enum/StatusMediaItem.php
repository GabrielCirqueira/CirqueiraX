<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusMediaItem: string
{
    case RECEBIDO = 'recebido';
    case EM_FILA = 'em_fila';
    case CLASSIFICADO = 'classificado';
    case DISTRIBUINDO = 'distribuindo';
    case DISTRIBUIDO_LOCAL = 'distribuido_local';
    case ENVIANDO_GOOGLE_FOTOS = 'enviando_google_fotos';
    case CONCLUIDO = 'concluido';
    case ERRO = 'erro';

    public function descricao(): string
    {
        return match ($this) {
            self::RECEBIDO => 'Recebido',
            self::EM_FILA => 'Em Fila de Processamento',
            self::CLASSIFICADO => 'Classificado',
            self::DISTRIBUINDO => 'Em Distribuição',
            self::DISTRIBUIDO_LOCAL => 'Distribuído Localmente',
            self::ENVIANDO_GOOGLE_FOTOS => 'Enviando para o Google Fotos',
            self::CONCLUIDO => 'Processamento Concluído',
            self::ERRO => 'Erro no Processamento',
        };
    }

    public function isFinal(): bool
    {
        return match ($this) {
            self::CONCLUIDO, self::ERRO => true,
            default => false,
        };
    }

    public function podeTransicionarPara(self $novoStatus): bool
    {
        if ($this === $novoStatus) {
            return true;
        }

        return match ($this) {
            self::RECEBIDO => in_array($novoStatus, [self::EM_FILA, self::CLASSIFICADO, self::ERRO], true),
            self::EM_FILA => in_array($novoStatus, [self::CLASSIFICADO, self::ERRO], true),
            self::CLASSIFICADO => in_array($novoStatus, [self::DISTRIBUINDO, self::DISTRIBUIDO_LOCAL, self::ENVIANDO_GOOGLE_FOTOS, self::CONCLUIDO, self::ERRO], true),
            self::DISTRIBUINDO => in_array($novoStatus, [self::DISTRIBUIDO_LOCAL, self::CONCLUIDO, self::ERRO], true),
            self::DISTRIBUIDO_LOCAL => in_array($novoStatus, [self::ENVIANDO_GOOGLE_FOTOS, self::CONCLUIDO, self::ERRO], true),
            self::ENVIANDO_GOOGLE_FOTOS => in_array($novoStatus, [self::DISTRIBUIDO_LOCAL, self::CONCLUIDO, self::ERRO], true),
            self::CONCLUIDO => in_array($novoStatus, [self::CLASSIFICADO, self::RECEBIDO], true),
            self::ERRO => in_array($novoStatus, [self::CLASSIFICADO, self::RECEBIDO, self::EM_FILA], true),
        };
    }
}
