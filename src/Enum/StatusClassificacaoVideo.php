<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusClassificacaoVideo: string
{
    case Pendente = 'pendente';
    case Musica = 'musica';
    case Mashup = 'mashup';
    case Compilacao = 'compilacao';
    case NaoMusica = 'nao_musica';
    case Revisar = 'revisar';
    case Indisponivel = 'indisponivel';

    public function descricao(): string
    {
        return match ($this) {
            self::Pendente => 'Aguardando identificação',
            self::Musica => 'Música',
            self::Mashup => 'Mashup',
            self::Compilacao => 'Compilação',
            self::NaoMusica => 'Não é música',
            self::Revisar => 'Precisa de revisão',
            self::Indisponivel => 'Vídeo indisponível',
        };
    }

    public function isPendente(): bool
    {
        return self::Pendente === $this;
    }

    public function isMusica(): bool
    {
        return self::Musica === $this;
    }

    public function isMashup(): bool
    {
        return self::Mashup === $this;
    }

    public function isCompilacao(): bool
    {
        return self::Compilacao === $this;
    }

    public function isNaoMusica(): bool
    {
        return self::NaoMusica === $this;
    }

    public function isRevisar(): bool
    {
        return self::Revisar === $this;
    }

    public function isIndisponivel(): bool
    {
        return self::Indisponivel === $this;
    }

    public function isContaComoMusica(): bool
    {
        return self::Musica === $this || self::Mashup === $this;
    }

    public function isFinal(): bool
    {
        return self::Pendente !== $this && self::Revisar !== $this;
    }
}
