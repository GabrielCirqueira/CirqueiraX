<?php

declare(strict_types=1);

namespace App\Service\TransferenciaPlaylist;

use App\DataObject\TransferenciaPlaylist\ListaPlaylistsDTO;
use App\DataObject\TransferenciaPlaylist\ParPlaylistDetectadoDTO;
use App\DataObject\TransferenciaPlaylist\PlaylistResumoDTO;
use App\Service\Musica\NormalizarTextoMusicaService;

final readonly class DetectarParesPlaylistDestinoService
{
    private const float SIMILARIDADE_MINIMA_SEM_NUMERO = 92.0;

    public function __construct(
        private NormalizarTextoMusicaService $normalizador,
    ) {
    }

    /**
     * @return list<ParPlaylistDetectadoDTO>
     */
    public function executar(ListaPlaylistsDTO $origem, ListaPlaylistsDTO $destino): array
    {
        /** @var array<string, ParPlaylistDetectadoDTO> $paresPorId */
        $paresPorId = [];
        /** @var array<string, true> $destinosUsados */
        $destinosUsados = [];

        foreach ($origem->itens as $playlistOrigem) {
            $parExato = $this->buscarParExato($playlistOrigem, $destino->itens, $destinosUsados);
            if (null === $parExato) {
                continue;
            }

            $paresPorId[$playlistOrigem->id] = new ParPlaylistDetectadoDTO($playlistOrigem, $parExato, 100.0);
            $destinosUsados[$parExato->id] = true;
        }

        foreach ($origem->itens as $playlistOrigem) {
            if (isset($paresPorId[$playlistOrigem->id])) {
                continue;
            }

            // Nomes com número (MSINT 26º, Top 2024, etc.) só casam por igualdade exata.
            if ([] !== $this->extrairNumeros($this->normalizador->normalizar($playlistOrigem->nome))) {
                $paresPorId[$playlistOrigem->id] = new ParPlaylistDetectadoDTO($playlistOrigem, null, 0.0);
                continue;
            }

            $parFuzzy = $this->buscarParFuzzySemNumero($playlistOrigem, $destino->itens, $destinosUsados);
            if (null === $parFuzzy) {
                $paresPorId[$playlistOrigem->id] = new ParPlaylistDetectadoDTO($playlistOrigem, null, 0.0);
                continue;
            }

            [$destinoEncontrado, $similaridade] = $parFuzzy;
            $paresPorId[$playlistOrigem->id] = new ParPlaylistDetectadoDTO(
                $playlistOrigem,
                $destinoEncontrado,
                $similaridade,
            );
            $destinosUsados[$destinoEncontrado->id] = true;
        }

        $pares = [];
        foreach ($origem->itens as $playlistOrigem) {
            $pares[] = $paresPorId[$playlistOrigem->id]
                ?? new ParPlaylistDetectadoDTO($playlistOrigem, null, 0.0);
        }

        return $pares;
    }

    /**
     * @param list<PlaylistResumoDTO> $destinos
     * @param array<string, true>     $destinosUsados
     */
    private function buscarParExato(
        PlaylistResumoDTO $origem,
        array $destinos,
        array $destinosUsados,
    ): ?PlaylistResumoDTO {
        $nomeOrigem = $this->normalizador->normalizar($origem->nome);
        if ('' === $nomeOrigem) {
            return null;
        }

        foreach ($destinos as $destino) {
            if (isset($destinosUsados[$destino->id])) {
                continue;
            }

            if ($nomeOrigem === $this->normalizador->normalizar($destino->nome)) {
                return $destino;
            }
        }

        return null;
    }

    /**
     * @param list<PlaylistResumoDTO> $destinos
     * @param array<string, true>     $destinosUsados
     *
     * @return array{PlaylistResumoDTO, float}|null
     */
    private function buscarParFuzzySemNumero(
        PlaylistResumoDTO $origem,
        array $destinos,
        array $destinosUsados,
    ): ?array {
        $nomeOrigem = $this->normalizador->normalizar($origem->nome);
        if ('' === $nomeOrigem) {
            return null;
        }

        $melhor = null;
        $melhorSimilaridade = 0.0;

        foreach ($destinos as $destino) {
            if (isset($destinosUsados[$destino->id])) {
                continue;
            }

            $nomeDestino = $this->normalizador->normalizar($destino->nome);
            if ('' === $nomeDestino) {
                continue;
            }

            // Destino numerado não pode casar por fuzzy com origem sem número (ex.: MSINT* ↔ MSINT 7).
            if ([] !== $this->extrairNumeros($nomeDestino)) {
                continue;
            }

            similar_text($nomeOrigem, $nomeDestino, $porcentagem);
            if ($porcentagem > $melhorSimilaridade) {
                $melhor = $destino;
                $melhorSimilaridade = $porcentagem;
            }
        }

        if (null === $melhor || $melhorSimilaridade < self::SIMILARIDADE_MINIMA_SEM_NUMERO) {
            return null;
        }

        return [$melhor, $melhorSimilaridade];
    }

    /**
     * @return list<int>
     */
    private function extrairNumeros(string $nome): array
    {
        if (!preg_match_all('/\d+/', $nome, $ocorrencias)) {
            return [];
        }

        return array_map(static fn (string $numero): int => (int) $numero, $ocorrencias[0]);
    }
}
