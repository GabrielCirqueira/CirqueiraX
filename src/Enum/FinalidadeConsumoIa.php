<?php

declare(strict_types=1);

namespace App\Enum;

enum FinalidadeConsumoIa: string
{
    case IdentificacaoMusica = 'identificacao_musica';
    case CorrecaoTranscricao = 'correcao_transcricao';
    case CorrecaoPronuncia = 'correcao_pronuncia';

    public function descricao(): string
    {
        return match ($this) {
            self::IdentificacaoMusica => 'Identificação de músicas',
            self::CorrecaoTranscricao => 'Correção de transcrição',
            self::CorrecaoPronuncia => 'Correção de pronúncia',
        };
    }
}
