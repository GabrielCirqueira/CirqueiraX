<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\TransferenciaPlaylist\CanalYoutubeOAuthDTO;
use App\DataObject\TransferenciaPlaylist\ListaFaixasPlaylistDTO;
use App\DataObject\TransferenciaPlaylist\ListaPlaylistsDTO;
use App\DataObject\TransferenciaPlaylist\PlaylistResumoDTO;

interface YoutubePlaylistInterface
{
    public function listarMinhasPlaylists(string $accessToken, int $limite = 50, ?string $pageToken = null): ListaPlaylistsDTO;

    public function listarItensPlaylist(string $accessToken, string $playlistId, int $limite = 50, ?string $pageToken = null): ListaFaixasPlaylistDTO;

    public function criarPlaylist(string $accessToken, string $titulo, ?string $descricao = null, string $privacyStatus = 'private'): PlaylistResumoDTO;

    public function adicionarItemPlaylist(string $accessToken, string $playlistId, string $videoId): string;

    public function removerItemPlaylist(string $accessToken, string $playlistItemId): void;

    public function obterCanalAutenticado(string $accessToken): CanalYoutubeOAuthDTO;
}
