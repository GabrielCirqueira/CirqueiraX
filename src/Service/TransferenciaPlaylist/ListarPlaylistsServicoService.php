<?php

declare(strict_types=1);

namespace App\Service\TransferenciaPlaylist;

use App\DataObject\TransferenciaPlaylist\ListaPlaylistsDTO;
use App\Entity\Usuario;
use App\Enum\ServicoPlaylist;
use App\Exception\TransferenciaPlaylist\TransferenciaPlaylistException;
use App\Interface\SpotifyInterface;
use App\Interface\YoutubePlaylistInterface;
use App\Repository\ContaSpotifyRepository;
use App\Repository\ContaYoutubeOAuthRepository;
use App\Service\Spotify\ObterTokenValidoSpotifyService;
use App\Service\YoutubeOAuth\ObterTokenValidoYoutubeOAuthService;

final readonly class ListarPlaylistsServicoService
{
    private const int LIMITE_PAGINA = 50;

    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ContaYoutubeOAuthRepository $contaYoutubeOAuthRepository,
        private ObterTokenValidoSpotifyService $obterTokenSpotify,
        private ObterTokenValidoYoutubeOAuthService $obterTokenYoutube,
        private SpotifyInterface $spotify,
        private YoutubePlaylistInterface $youtubePlaylist,
    ) {
    }

    public function executar(Usuario $usuario, ServicoPlaylist $servico): ListaPlaylistsDTO
    {
        if ($servico->isSpotify()) {
            return $this->listarSpotify($usuario);
        }

        return $this->listarYoutube($usuario);
    }

    private function listarSpotify(Usuario $usuario): ListaPlaylistsDTO
    {
        $conta = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
        if (null === $conta) {
            throw TransferenciaPlaylistException::contaSpotifyNecessaria();
        }

        $token = $this->obterTokenSpotify->executar($conta);
        $itens = [];
        $offset = 0;
        $total = 0;

        do {
            $pagina = $this->spotify->listarMinhasPlaylists($token, self::LIMITE_PAGINA, $offset);
            $total = $pagina->total;
            foreach ($pagina->itens as $item) {
                $itens[] = $item;
            }
            $offset += count($pagina->itens);
        } while ($offset < $total && [] !== $pagina->itens);

        return new ListaPlaylistsDTO($itens, $total);
    }

    private function listarYoutube(Usuario $usuario): ListaPlaylistsDTO
    {
        $conta = $this->contaYoutubeOAuthRepository->buscarDoUsuario($usuario);
        if (null === $conta) {
            throw TransferenciaPlaylistException::contaYoutubeOAuthNecessaria();
        }

        $token = $this->obterTokenYoutube->executar($conta);
        $itens = [];
        $pageToken = null;
        $total = 0;

        do {
            $pagina = $this->youtubePlaylist->listarMinhasPlaylists($token, self::LIMITE_PAGINA, $pageToken);
            $total = $pagina->total;
            foreach ($pagina->itens as $item) {
                $itens[] = $item;
            }
            $pageToken = $pagina->proximoPageToken;
        } while (null !== $pageToken && '' !== $pageToken);

        return new ListaPlaylistsDTO($itens, max($total, count($itens)));
    }
}
