<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

final readonly class NormalizadorTituloMusica
{
    private const array PADROES_SUFIXO = [
        '/\s+-\s+.*$/u',
        '/\s*[(\[][^)\]]*\b(feat|ft|with|remaster|remastered|live|version|edit|mix|mono|stereo|deluxe|acoustic|radio)\b[^)\]]*[)\]]/iu',
    ];

    /**
     * Tira do título o que o Spotify acrescenta e os sites de letra não usam, como " - Remastered 2011" e "(feat. Fulano)".
     */
    public function semSufixos(string $titulo): string
    {
        $limpo = (string) preg_replace(self::PADROES_SUFIXO, '', $titulo);

        return '' === trim($limpo) ? trim($titulo) : trim($limpo);
    }
}
