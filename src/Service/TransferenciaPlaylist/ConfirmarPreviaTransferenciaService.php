<?php

declare(strict_types=1);

namespace App\Service\TransferenciaPlaylist;

use App\DataObject\TransferenciaPlaylist\ConfirmarPreviaTransferenciaDTO;
use App\DataObject\TransferenciaPlaylist\ItemConfirmacaoPreviaDTO;
use App\Entity\TransferenciaPlaylist;
use App\Entity\Usuario;
use App\Enum\StatusItemTransferenciaPlaylist;
use App\Exception\TransferenciaPlaylist\TransferenciaPlaylistException;
use App\Repository\ItemTransferenciaPlaylistRepository;
use App\Repository\TransferenciaPlaylistRepository;

final readonly class ConfirmarPreviaTransferenciaService
{
    public function __construct(
        private ItemTransferenciaPlaylistRepository $itemRepository,
        private TransferenciaPlaylistRepository $transferenciaRepository,
    ) {
    }

    public function executar(Usuario $usuario, string $transferenciaUuid, ConfirmarPreviaTransferenciaDTO $dto): TransferenciaPlaylist
    {
        $transferencia = $this->transferenciaRepository->buscarDoUsuarioPorUuid($usuario, $transferenciaUuid);
        if (null === $transferencia) {
            throw TransferenciaPlaylistException::transferenciaNaoEncontrada();
        }

        if (!$transferencia->isPrevia()) {
            throw TransferenciaPlaylistException::transferenciaNaoEstaEmPrevia();
        }

        $entradas = $dto->itensNormalizados();
        $uuidsIgnorados = $dto->uuidsIgnoradosNormalizados();

        $uuids = array_values(array_unique([
            ...array_map(static fn (ItemConfirmacaoPreviaDTO $item): string => $item->uuid, $entradas),
            ...$uuidsIgnorados,
        ]));

        if ([] !== $uuids) {
            $itens = $this->itemRepository->listarPorUuidsDaTransferencia($transferencia, $uuids);
            $mapa = [];
            foreach ($itens as $item) {
                $mapa[$item->uuid()->toRfc4122()] = $item;
            }

            foreach ($entradas as $entrada) {
                $item = $mapa[$entrada->uuid] ?? null;
                if (null === $item) {
                    continue;
                }

                $status = StatusItemTransferenciaPlaylist::tryFrom($entrada->status);
                if (null === $status) {
                    continue;
                }

                $item->aplicarConfirmacao(
                    $status,
                    $entrada->idExternoDestino,
                    $entrada->tituloDestino,
                    $entrada->artistasDestino,
                );
                $this->itemRepository->salvar($item, false);
            }

            foreach ($uuidsIgnorados as $uuidIgnorado) {
                $item = $mapa[$uuidIgnorado] ?? null;
                if (null === $item) {
                    continue;
                }

                $item->aplicarConfirmacao(StatusItemTransferenciaPlaylist::Ignorada, null, null, null);
                $this->itemRepository->salvar($item, false);
            }

            $this->itemRepository->flush();
        }

        $contagem = $this->itemRepository->contarPorStatus($transferencia);
        $transferencia->atualizarContadores(
            $contagem['total'],
            $contagem['casadas'],
            $contagem['duvidosas'],
            $contagem['naoEncontradas'],
            $contagem['transferidas'],
            $contagem['falhas'],
        );
        $this->transferenciaRepository->salvar($transferencia);

        return $transferencia;
    }
}
