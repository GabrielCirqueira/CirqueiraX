<?php

declare(strict_types=1);

namespace App\DataObject\TransferenciaPlaylist;

use App\Exception\TransferenciaPlaylist\TransferenciaPlaylistException;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class IniciarTransferenciaPlaylistDTO
{
    /**
     * @param list<PlaylistSelecionadaEntradaDTO|array<string, mixed>> $playlists
     */
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Choice(choices: ['spotify', 'youtube'])]
        public string $origem,
        #[Assert\NotBlank]
        #[Assert\Choice(choices: ['spotify', 'youtube'])]
        public string $destino,
        #[Assert\NotBlank]
        #[Assert\Count(min: 1)]
        public array $playlists,
    ) {
    }

    /**
     * @return list<PlaylistSelecionadaEntradaDTO>
     */
    public function playlistsNormalizadas(): array
    {
        $resultado = [];

        foreach ($this->playlists as $playlist) {
            if ($playlist instanceof PlaylistSelecionadaEntradaDTO) {
                $resultado[] = $playlist;
                continue;
            }

            if (!is_array($playlist)) {
                throw TransferenciaPlaylistException::nenhumaPlaylistSelecionada();
            }

            $idExterno = $playlist['idExterno'] ?? null;
            if (!is_string($idExterno) || '' === trim($idExterno)) {
                throw TransferenciaPlaylistException::nenhumaPlaylistSelecionada();
            }

            $decisao = $playlist['decisao'] ?? null;
            $idDestinoExistente = $playlist['idDestinoExistente'] ?? null;

            $resultado[] = new PlaylistSelecionadaEntradaDTO(
                idExterno: $idExterno,
                decisao: is_string($decisao) ? $decisao : null,
                idDestinoExistente: is_string($idDestinoExistente) ? $idDestinoExistente : null,
            );
        }

        return $resultado;
    }
}
