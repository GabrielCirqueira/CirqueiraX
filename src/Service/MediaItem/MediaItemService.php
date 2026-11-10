<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\Entity\MediaItem;
use App\Entity\Usuario;
use App\Enum\OrigemMedia;
use App\Enum\StatusMediaItem;
use App\Exception\MediaItem\MediaItemException;
use App\Repository\MediaItemRepository;
use Symfony\Component\Uid\Uuid;

final readonly class MediaItemService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
    ) {}

    public function buscarDoUsuario(string|Uuid $uuid, Usuario $usuario): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarDoUsuario($uuid, $usuario);
        if (null === $mediaItem) {
            throw MediaItemException::midiaNaoEncontradaPorUuid();
        }

        return $mediaItem;
    }

    /**
     * @param list<string> $uuids
     */
    public function garantirQuePertencemAoUsuario(array $uuids, Usuario $usuario): void
    {
        $unicos = array_values(array_unique($uuids));
        if ($this->mediaItemRepository->contarDoUsuario($unicos, $usuario) === count($unicos)) {
            return;
        }

        throw MediaItemException::midiaNaoEncontradaPorUuid();
    }

    /**
     * @param array{
     *     status?: StatusMediaItem|string|null,
     *     origem?: OrigemMedia|string|null,
     *     categoriaId?: string|null,
     *     busca?: string|null,
     *     ordenacao?: string|null,
     *     direcao?: string|null
     * } $filtros
     *
     * @return array{itens: array<int, MediaItem>, total: int}
     */
    public function paginarComFiltros(Usuario $usuario, array $filtros = [], int $pagina = 1, int $limite = 20): array
    {
        return $this->mediaItemRepository->paginarComFiltros($usuario, $filtros, $pagina, $limite);
    }
}
