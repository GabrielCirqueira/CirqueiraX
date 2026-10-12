<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusMediaItem: string
{
    case RECEBIDO = 'recebido';
    case EM_FILA = 'em_fila';
    case SEM_CATEGORIA = 'sem_categoria';
    case CLASSIFICADO = 'classificado';
    case DISTRIBUINDO = 'distribuindo';
    case BAIXANDO = 'baixando';
    case DISTRIBUIDO_LOCAL = 'distribuido_local';
    case ENVIANDO_GOOGLE_FOTOS = 'enviando_google_fotos';
    case CONCLUIDO = 'concluido';
    case ERRO = 'erro';
    case ARQUIVO_REMOVIDO = 'arquivo_removido';
    case ARQUIVO_EXPURGADO = 'arquivo_expurgado';

    public function descricao(): string
    {
        return match ($this) {
            self::RECEBIDO => 'Recebido',
            self::EM_FILA => 'Em Fila de Processamento',
            self::SEM_CATEGORIA => 'Sem Categoria',
            self::CLASSIFICADO => 'Classificado',
            self::DISTRIBUINDO => 'Em Distribuição',
            self::BAIXANDO => 'Baixando Vídeo',
            self::DISTRIBUIDO_LOCAL => 'Distribuído Localmente',
            self::ENVIANDO_GOOGLE_FOTOS => 'Enviando para o Google Fotos',
            self::CONCLUIDO => 'Processamento Concluído',
            self::ERRO => 'Erro no Processamento',
            self::ARQUIVO_REMOVIDO, self::ARQUIVO_EXPURGADO => 'Arquivo Removido (Espaço Liberado)',
        };
    }

    public function isFinal(): bool
    {
        return match ($this) {
            self::CONCLUIDO, self::ERRO, self::ARQUIVO_REMOVIDO, self::ARQUIVO_EXPURGADO => true,
            default => false,
        };
    }

    public function isSemCategoria(): bool
    {
        return self::SEM_CATEGORIA === $this;
    }

    public function podeTransicionarPara(self $novoStatus): bool
    {
        if ($this === $novoStatus) {
            return true;
        }

        return match ($this) {
            self::BAIXANDO => in_array($novoStatus, [self::RECEBIDO, self::EM_FILA, self::SEM_CATEGORIA, self::CLASSIFICADO, self::ERRO, self::DISTRIBUIDO_LOCAL, self::CONCLUIDO], true),
            self::RECEBIDO => in_array($novoStatus, [self::EM_FILA, self::SEM_CATEGORIA, self::CLASSIFICADO, self::ERRO], true),
            self::EM_FILA => in_array($novoStatus, [self::SEM_CATEGORIA, self::CLASSIFICADO, self::ERRO], true),
            self::SEM_CATEGORIA => in_array($novoStatus, [self::CLASSIFICADO, self::BAIXANDO, self::RECEBIDO, self::ERRO, self::DISTRIBUINDO, self::DISTRIBUIDO_LOCAL, self::ENVIANDO_GOOGLE_FOTOS, self::CONCLUIDO, self::ARQUIVO_REMOVIDO, self::ARQUIVO_EXPURGADO], true),
            self::CLASSIFICADO => in_array($novoStatus, [self::DISTRIBUINDO, self::DISTRIBUIDO_LOCAL, self::ENVIANDO_GOOGLE_FOTOS, self::CONCLUIDO, self::SEM_CATEGORIA, self::ERRO], true),
            self::DISTRIBUINDO => in_array($novoStatus, [self::DISTRIBUIDO_LOCAL, self::CONCLUIDO, self::ERRO], true),
            self::DISTRIBUIDO_LOCAL => in_array($novoStatus, [self::ENVIANDO_GOOGLE_FOTOS, self::CONCLUIDO, self::SEM_CATEGORIA, self::ERRO, self::ARQUIVO_REMOVIDO, self::ARQUIVO_EXPURGADO, self::BAIXANDO], true),
            self::ENVIANDO_GOOGLE_FOTOS => in_array($novoStatus, [self::DISTRIBUIDO_LOCAL, self::CONCLUIDO, self::SEM_CATEGORIA, self::ERRO], true),
            self::CONCLUIDO => in_array($novoStatus, [self::CLASSIFICADO, self::RECEBIDO, self::SEM_CATEGORIA, self::ARQUIVO_REMOVIDO, self::ARQUIVO_EXPURGADO, self::BAIXANDO], true),
            self::ERRO => in_array($novoStatus, [self::BAIXANDO, self::CLASSIFICADO, self::RECEBIDO, self::EM_FILA, self::SEM_CATEGORIA, self::DISTRIBUINDO, self::DISTRIBUIDO_LOCAL, self::ENVIANDO_GOOGLE_FOTOS, self::CONCLUIDO], true),
            self::ARQUIVO_REMOVIDO, self::ARQUIVO_EXPURGADO => in_array($novoStatus, [self::BAIXANDO, self::CONCLUIDO, self::DISTRIBUIDO_LOCAL, self::ERRO], true),
        };
    }
}
