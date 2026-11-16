<?php

declare(strict_types=1);

namespace App\DataObject\TransferenciaPlaylist;

use App\Exception\TransferenciaPlaylist\TransferenciaPlaylistException;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class ConfirmarPreviaTransferenciaDTO
{
    /**
     * @param list<ItemConfirmacaoPreviaDTO|array<string, mixed>> $itens
     */
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Count(min: 1)]
        public array $itens,
    ) {
    }

    /**
     * @return list<ItemConfirmacaoPreviaDTO>
     */
    public function itensNormalizados(): array
    {
        $resultado = [];

        foreach ($this->itens as $item) {
            if ($item instanceof ItemConfirmacaoPreviaDTO) {
                $resultado[] = $item;
                continue;
            }

            if (!is_array($item)) {
                throw TransferenciaPlaylistException::transferenciaNaoEstaEmPrevia();
            }

            $uuid = $item['uuid'] ?? null;
            $status = $item['status'] ?? null;
            if (!is_string($uuid) || '' === trim($uuid) || !is_string($status) || '' === trim($status)) {
                continue;
            }

            $idExternoDestino = $item['idExternoDestino'] ?? null;
            $tituloDestino = $item['tituloDestino'] ?? null;
            $artistasDestino = $item['artistasDestino'] ?? null;

            $resultado[] = new ItemConfirmacaoPreviaDTO(
                uuid: $uuid,
                status: $status,
                idExternoDestino: is_string($idExternoDestino) ? $idExternoDestino : null,
                tituloDestino: is_string($tituloDestino) ? $tituloDestino : null,
                artistasDestino: is_string($artistasDestino) ? $artistasDestino : null,
            );
        }

        return $resultado;
    }
}
