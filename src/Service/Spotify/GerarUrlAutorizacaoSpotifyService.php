<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\Entity\Usuario;
use App\Interface\SpotifyInterface;
use Psr\Cache\CacheItemPoolInterface;

final readonly class GerarUrlAutorizacaoSpotifyService
{
    public const int VALIDADE_STATE_SEGUNDOS = 600;
    public const array ESCOPOS_PADRAO = [
        'user-read-recently-played',
        'user-read-currently-playing',
        'user-top-read',
    ];
    private const string PREFIXO_CACHE_STATE = 'spotify_state_';

    public function __construct(
        private SpotifyInterface $spotifyClient,
        private CacheItemPoolInterface $cache,
    ) {
    }

    /**
     * @return array{url: string, state: string}
     */
    public function executar(Usuario $usuario): array
    {
        $state = bin2hex(random_bytes(16));
        $chaveCache = self::PREFIXO_CACHE_STATE.$state;

        $item = $this->cache->getItem($chaveCache);
        $item->set((string) $usuario->getId());
        $item->expiresAfter(self::VALIDADE_STATE_SEGUNDOS);
        $this->cache->save($item);

        $url = $this->spotifyClient->gerarUrlAutorizacao($state, self::ESCOPOS_PADRAO);

        return [
            'url' => $url,
            'state' => $state,
        ];
    }
}
