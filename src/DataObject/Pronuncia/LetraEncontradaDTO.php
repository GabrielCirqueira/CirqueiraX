<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use App\Enum\SituacaoLetraMusica;

final readonly class LetraEncontradaDTO
{
    /**
     * @param list<LinhaLetraDTO> $linhas
     */
    public function __construct(
        public SituacaoLetraMusica $situacao,
        public array $linhas = [],
    ) {
    }

    public static function naoEncontrada(): self
    {
        return new self(SituacaoLetraMusica::NaoEncontrada);
    }

    public static function instrumental(): self
    {
        return new self(SituacaoLetraMusica::Instrumental);
    }
}
