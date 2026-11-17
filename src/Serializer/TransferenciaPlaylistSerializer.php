<?php

declare(strict_types=1);

namespace App\Serializer;

use App\DataObject\TransferenciaPlaylist\ParPlaylistDetectadoDTO;
use App\DataObject\TransferenciaPlaylist\PlaylistResumoDTO;
use App\Entity\ItemTransferenciaPlaylist;
use App\Entity\PlaylistTransferenciaSelecionada;
use App\Entity\TransferenciaPlaylist;
use App\Entity\VinculoPlaylist;
use App\Repository\ItemTransferenciaPlaylistRepository;
use App\Repository\PlaylistTransferenciaSelecionadaRepository;
use DateTimeInterface;

final class TransferenciaPlaylistSerializer
{
    public function __construct(
        private readonly ItemTransferenciaPlaylistRepository $itemRepository,
        private readonly PlaylistTransferenciaSelecionadaRepository $playlistSelecionadaRepository,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function serializarResumo(TransferenciaPlaylist $transferencia): array
    {
        return [
            'uuid' => $transferencia->uuid()->toRfc4122(),
            'origem' => $transferencia->origem()->value,
            'destino' => $transferencia->destino()->value,
            'status' => $transferencia->status()->value,
            'statusDescricao' => $transferencia->status()->descricao(),
            'totalFaixas' => $transferencia->totalFaixas(),
            'totalCasadas' => $transferencia->totalCasadas(),
            'totalDuvidosas' => $transferencia->totalDuvidosas(),
            'totalNaoEncontradas' => $transferencia->totalNaoEncontradas(),
            'totalTransferidas' => $transferencia->totalTransferidas(),
            'totalFalhas' => $transferencia->totalFalhas(),
            'mensagemErro' => $transferencia->mensagemErro(),
            'criadoEm' => $transferencia->criadoEm()->format(DateTimeInterface::ATOM),
            'atualizadoEm' => $transferencia->atualizadoEm()->format(DateTimeInterface::ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function serializarDetalhe(TransferenciaPlaylist $transferencia, bool $incluirTodasFaixas = false): array
    {
        $itens = $incluirTodasFaixas
            ? $this->itemRepository->listarDaTransferencia($transferencia)
            : $this->itemRepository->listarParaRevisaoPrevia($transferencia);

        return [
            ...$this->serializarResumo($transferencia),
            'playlists' => array_map(
                $this->serializarPlaylistSelecionada(...),
                $this->playlistSelecionadaRepository->listarDaTransferencia($transferencia),
            ),
            'itens' => array_map(
                $this->serializarItem(...),
                $itens,
            ),
            'itensResumo' => !$incluirTodasFaixas,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function serializarPlaylistResumo(PlaylistResumoDTO $playlist): array
    {
        return [
            'id' => $playlist->id,
            'nome' => $playlist->nome,
            'totalFaixas' => $playlist->totalFaixas,
            'urlCapa' => $playlist->urlCapa,
            'snapshotId' => $playlist->snapshotId,
            'dono' => $playlist->dono,
        ];
    }

    /**
     * @param list<PlaylistResumoDTO> $playlists
     *
     * @return list<array<string, mixed>>
     */
    public function serializarListaPlaylists(array $playlists): array
    {
        return array_map($this->serializarPlaylistResumo(...), $playlists);
    }

    /**
     * @param list<ParPlaylistDetectadoDTO> $pares
     *
     * @return list<array<string, mixed>>
     */
    public function serializarPares(array $pares): array
    {
        return array_map(function (ParPlaylistDetectadoDTO $par): array {
            return [
                'origem' => $this->serializarPlaylistResumo($par->origem),
                'destino' => null === $par->destino ? null : $this->serializarPlaylistResumo($par->destino),
                'similaridade' => $par->similaridade,
            ];
        }, $pares);
    }

    /**
     * @return array<string, mixed>
     */
    public function serializarVinculo(VinculoPlaylist $vinculo): array
    {
        return [
            'uuid' => $vinculo->uuid()->toRfc4122(),
            'idSpotify' => $vinculo->idSpotify(),
            'nomeSpotify' => $vinculo->nomeSpotify(),
            'snapshotIdSpotify' => $vinculo->snapshotIdSpotify(),
            'idYoutube' => $vinculo->idYoutube(),
            'nomeYoutube' => $vinculo->nomeYoutube(),
            'modo' => $vinculo->modo()->value,
            'modoDescricao' => $vinculo->modo()->descricao(),
            'ativo' => $vinculo->isAtivo(),
            'ultimaSincronizacaoEm' => $vinculo->ultimaSincronizacaoEm()?->format(DateTimeInterface::ATOM),
            'criadoEm' => $vinculo->criadoEm()->format(DateTimeInterface::ATOM),
            'atualizadoEm' => $vinculo->atualizadoEm()->format(DateTimeInterface::ATOM),
        ];
    }

    /**
     * @param list<VinculoPlaylist> $vinculos
     *
     * @return list<array<string, mixed>>
     */
    public function serializarVinculos(array $vinculos): array
    {
        return array_map($this->serializarVinculo(...), $vinculos);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializarPlaylistSelecionada(PlaylistTransferenciaSelecionada $playlist): array
    {
        return [
            'uuid' => $playlist->uuid()->toRfc4122(),
            'idExternoOrigem' => $playlist->idExternoOrigem(),
            'nomeOrigem' => $playlist->nomeOrigem(),
            'totalFaixasOrigem' => $playlist->totalFaixasOrigem(),
            'urlCapaOrigem' => $playlist->urlCapaOrigem(),
            'snapshotIdOrigem' => $playlist->snapshotIdOrigem(),
            'idExternoDestinoExistente' => $playlist->idExternoDestinoExistente(),
            'nomeDestinoExistente' => $playlist->nomeDestinoExistente(),
            'decisao' => $playlist->decisao()->value,
            'idExternoDestinoFinal' => $playlist->idExternoDestinoFinal(),
            'progressoFaixas' => $playlist->progressoFaixas(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializarItem(ItemTransferenciaPlaylist $item): array
    {
        return [
            'uuid' => $item->uuid()->toRfc4122(),
            'playlistSelecionadaUuid' => $item->playlistSelecionada()?->uuid()->toRfc4122(),
            'ordem' => $item->ordem(),
            'idExternoOrigem' => $item->idExternoOrigem(),
            'tituloOrigem' => $item->tituloOrigem(),
            'artistasOrigem' => $item->artistasOrigem(),
            'duracaoMsOrigem' => $item->duracaoMsOrigem(),
            'urlCapaOrigem' => $item->urlCapaOrigem(),
            'idExternoDestino' => $item->idExternoDestino(),
            'tituloDestino' => $item->tituloDestino(),
            'artistasDestino' => $item->artistasDestino(),
            'pontuacao' => $item->pontuacao(),
            'status' => $item->status()->value,
            'statusDescricao' => $item->status()->descricao(),
            'musicaCatalogoUuid' => $item->musicaCatalogo()?->uuid()->toRfc4122(),
        ];
    }
}
