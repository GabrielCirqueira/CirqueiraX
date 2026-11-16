<?php

declare(strict_types=1);

namespace App\Enum;

enum DecisaoPlaylistDestino: string
{
    case CriarNova = 'criar_nova';
    case AtualizarOrigemParaDestino = 'atualizar_origem_para_destino';
    case AtualizarDestinoParaOrigem = 'atualizar_destino_para_origem';
    case SoVincular = 'so_vincular';

    public function isCriarNova(): bool
    {
        return self::CriarNova === $this;
    }

    public function isAtualizarOrigemParaDestino(): bool
    {
        return self::AtualizarOrigemParaDestino === $this;
    }

    public function isAtualizarDestinoParaOrigem(): bool
    {
        return self::AtualizarDestinoParaOrigem === $this;
    }

    public function isSoVincular(): bool
    {
        return self::SoVincular === $this;
    }

    public function descricao(): string
    {
        return match ($this) {
            self::CriarNova => 'Criar nova',
            self::AtualizarOrigemParaDestino => 'Atualizar origem para destino',
            self::AtualizarDestinoParaOrigem => 'Atualizar destino para origem',
            self::SoVincular => 'Somente vincular',
        };
    }
}
