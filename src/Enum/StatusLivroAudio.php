<?php

declare(strict_types=1);

namespace App\Enum;

enum StatusLivroAudio: string
{
    case ENVIADO = 'enviado';
    case EXTRAINDO = 'extraindo';
    case GERANDO_AUDIO = 'gerando_audio';
    case PARCIAL = 'parcial';
    case PRONTO = 'pronto';
    case ERRO = 'erro';

    public function descricao(): string
    {
        return match ($this) {
            self::ENVIADO => 'Enviado',
            self::EXTRAINDO => 'Extraindo texto',
            self::GERANDO_AUDIO => 'Gerando áudio',
            self::PARCIAL => 'Áudio parcial',
            self::PRONTO => 'Pronto',
            self::ERRO => 'Erro',
        };
    }

    public function isEnviado(): bool
    {
        return self::ENVIADO === $this;
    }

    public function isExtraindo(): bool
    {
        return self::EXTRAINDO === $this;
    }

    public function isGerandoAudio(): bool
    {
        return self::GERANDO_AUDIO === $this;
    }

    public function isParcial(): bool
    {
        return self::PARCIAL === $this;
    }

    public function isPronto(): bool
    {
        return self::PRONTO === $this;
    }

    public function isErro(): bool
    {
        return self::ERRO === $this;
    }

    public function isEmProcessamento(): bool
    {
        return self::ENVIADO === $this || self::EXTRAINDO === $this || self::GERANDO_AUDIO === $this;
    }

    public function isDisponivelParaOuvir(): bool
    {
        return self::PARCIAL === $this || self::PRONTO === $this;
    }

    public function isFinal(): bool
    {
        return self::PRONTO === $this || self::ERRO === $this;
    }
}
