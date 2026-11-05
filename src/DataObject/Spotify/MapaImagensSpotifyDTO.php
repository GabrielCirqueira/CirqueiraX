<?php

declare(strict_types=1);

namespace App\DataObject\Spotify;

final readonly class MapaImagensSpotifyDTO
{
    /**
     * @param array<string, string> $imagensPorChave
     * @param array<string, string> $urlsSpotifyPorChave
     */
    public function __construct(
        private array $imagensPorChave = [],
        private array $urlsSpotifyPorChave = [],
    ) {
    }

    public function obterImagem(string $chave): ?string
    {
        return $this->imagensPorChave[$chave] ?? null;
    }

    public function obterUrlSpotify(string $chave, ?string $padrao = null): ?string
    {
        return $this->urlsSpotifyPorChave[$chave] ?? $padrao;
    }
}

