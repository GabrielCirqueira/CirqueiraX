<?php

declare(strict_types=1);

namespace App\Service\TransferenciaPlaylist;

use App\DataObject\TransferenciaPlaylist\ListaPlaylistsDTO;
use App\DataObject\TransferenciaPlaylist\ParPlaylistDetectadoDTO;
use App\DataObject\TransferenciaPlaylist\PlaylistResumoDTO;
use App\Service\Musica\NormalizarTextoMusicaService;

final readonly class DetectarParesPlaylistDestinoService
{
    private const float SIMILARIDADE_MINIMA = 80.0;

    public function __construct(
        private NormalizarTextoMusicaService $normalizador,
    ) {
    }

    /**
     * @return list<ParPlaylistDetectadoDTO>
     */
    public function executar(ListaPlaylistsDTO $origem, ListaPlaylistsDTO $destino): array
    {
        $pares = [];
        foreach ($origem->itens as $playlistOrigem) {
            $pares[] = $this->encontrarPar($playlistOrigem, $destino->itens);
        }

        return $pares;
    }

    /**
     * @param list<PlaylistResumoDTO> $destinos
     */
    private function encontrarPar(PlaylistResumoDTO $origem, array $destinos): ParPlaylistDetectadoDTO
    {
        $nomeOrigem = $this->normalizador->normalizar($origem->nome);
        $melhor = null;
        $melhorSimilaridade = 0.0;

        foreach ($destinos as $destino) {
            $nomeDestino = $this->normalizador->normalizar($destino->nome);
            if ('' === $nomeOrigem || '' === $nomeDestino) {
                continue;
            }

            if ($nomeOrigem === $nomeDestino) {
                return new ParPlaylistDetectadoDTO($origem, $destino, 100.0);
            }

            similar_text($nomeOrigem, $nomeDestino, $porcentagem);
            if ($porcentagem > $melhorSimilaridade) {
                $melhor = $destino;
                $melhorSimilaridade = $porcentagem;
            }
        }

        if (null === $melhor || $melhorSimilaridade < self::SIMILARIDADE_MINIMA) {
            return new ParPlaylistDetectadoDTO($origem, null, 0.0);
        }

        return new ParPlaylistDetectadoDTO($origem, $melhor, $melhorSimilaridade);
    }
}
