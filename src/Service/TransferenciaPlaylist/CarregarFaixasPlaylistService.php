<?php

declare(strict_types=1);

namespace App\Service\TransferenciaPlaylist;

use App\DataObject\TransferenciaPlaylist\FaixaPlaylistDTO;
use App\Enum\ServicoPlaylist;
use App\Interface\SpotifyInterface;
use App\Interface\YoutubePlaylistInterface;

final readonly class CarregarFaixasPlaylistService
{
    private const int LIMITE_SPOTIFY = 100;
    private const int LIMITE_YOUTUBE = 50;

    public function __construct(
        private SpotifyInterface $spotify,
        private YoutubePlaylistInterface $youtubePlaylist,
    ) {
    }

    /**
     * @return list<FaixaPlaylistDTO>
     */
    public function executar(ServicoPlaylist $servico, string $accessToken, string $playlistId): array
    {
        if ($servico->isSpotify()) {
            return $this->carregarSpotify($accessToken, $playlistId);
        }

        return $this->carregarYoutube($accessToken, $playlistId);
    }

    /**
     * @return list<FaixaPlaylistDTO>
     */
    private function carregarSpotify(string $accessToken, string $playlistId): array
    {
        $itens = [];
        $offset = 0;

        do {
            $pagina = $this->spotify->listarItensPlaylist($accessToken, $playlistId, self::LIMITE_SPOTIFY, $offset);
            foreach ($pagina->itens as $item) {
                $itens[] = $item;
            }
            $offset = $pagina->proximoOffset;
        } while (null !== $offset);

        return $itens;
    }

    /**
     * @return list<FaixaPlaylistDTO>
     */
    private function carregarYoutube(string $accessToken, string $playlistId): array
    {
        $itens = [];
        $pageToken = null;

        do {
            $pagina = $this->youtubePlaylist->listarItensPlaylist($accessToken, $playlistId, self::LIMITE_YOUTUBE, $pageToken);
            foreach ($pagina->itens as $item) {
                $itens[] = $item;
            }
            $pageToken = $pagina->proximoPageToken;
        } while (null !== $pageToken && '' !== $pageToken);

        return $itens;
    }
}
