<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusItemTransferenciaPlaylist: string
{
    case Pendente = 'pendente';
    case Casada = 'casada';
    case Duvidosa = 'duvidosa';
    case NaoEncontrada = 'nao_encontrada';
    case Ignorada = 'ignorada';
    case Transferida = 'transferida';
    case Falha = 'falha';

    public function isPendente(): bool
    {
        return self::Pendente === $this;
    }

    public function isCasada(): bool
    {
        return self::Casada === $this;
    }

    public function isDuvidosa(): bool
    {
        return self::Duvidosa === $this;
    }

    public function isNaoEncontrada(): bool
    {
        return self::NaoEncontrada === $this;
    }

    public function isIgnorada(): bool
    {
        return self::Ignorada === $this;
    }

    public function isTransferida(): bool
    {
        return self::Transferida === $this;
    }

    public function isFalha(): bool
    {
        return self::Falha === $this;
    }

    public function isProntaParaTransferir(): bool
    {
        return self::Casada === $this || self::Duvidosa === $this;
    }

    public function descricao(): string
    {
        return match ($this) {
            self::Pendente => 'Pendente',
            self::Casada => 'Casada',
            self::Duvidosa => 'Duvidosa',
            self::NaoEncontrada => 'Não encontrada',
            self::Ignorada => 'Ignorada',
            self::Transferida => 'Transferida',
            self::Falha => 'Falha',
        };
    }
}
