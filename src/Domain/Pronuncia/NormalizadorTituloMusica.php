<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

final readonly class NormalizadorTituloMusica
{
    private const array PADROES_SUFIXO = [
        '/\s+-\s+.*$/u',
        '/\s*[(\[][^)\]]*\b(feat|ft|with|remaster|remastered|live|version|edit|mix|mono|stereo|deluxe|acoustic|radio|official|oficial|video|vídeo|clipe|lyrics?|letra|audio|áudio|visualizer|visualiser|hd|4k)\b[^)\]]*[)\]]/iu',
    ];

    /**
     * Tira do título o que o Spotify e o YouTube acrescentam e os sites de letra não usam, como " - Remastered 2011", "(feat. Fulano)" e "(Official Video)".
     */
    public function semSufixos(string $titulo): string
    {
        $limpo = (string) preg_replace(self::PADROES_SUFIXO, '', $titulo);

        return '' === trim($limpo) ? trim($titulo) : trim($limpo);
    }
}
