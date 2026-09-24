<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Repository\CategoriaRepository;
use App\Repository\MediaItemRepository;
use Symfony\Component\Uid\Uuid;

final readonly class DistribuirLocalService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private CategoriaRepository $categoriaRepository,
        private string $mediaStoragePath = './var/storage',
        private string $projectDir = '',
    ) {
    }

    public function executar(string|Uuid $uuid): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
        if (null === $mediaItem) {
            throw new \DomainException('media_item_nao_encontrado', 404);
        }

        if (null === $mediaItem->categoriaId()) {
            throw new \DomainException('categoria_nao_definida', 400);
        }

        $categoria = $this->categoriaRepository->buscarPorUuid($mediaItem->categoriaId());
        if (null === $categoria) {
            throw new \DomainException('categoria_nao_encontrada', 404);
        }

        $caminhoOrigem = $mediaItem->caminhoLocal();
        if (null === $caminhoOrigem || !file_exists($caminhoOrigem)) {
            throw new \DomainException('arquivo_origem_nao_encontrado', 404);
        }

        $baseStoragePath = $this->mediaStoragePath;
        if (!str_starts_with($baseStoragePath, '/') && '' !== $this->projectDir) {
            $baseStoragePath = $this->projectDir.'/'.ltrim($baseStoragePath, './');
        }

        $pastaLocal = trim($categoria->pastaLocal(), '/');
        $diretorioDestino = rtrim($baseStoragePath, '/').'/'.$pastaLocal;

        if (!is_dir($diretorioDestino)) {
            mkdir($diretorioDestino, 0777, true);
        }

        $nomeArquivo = basename($caminhoOrigem);
        $caminhoDestino = $diretorioDestino.'/'.$nomeArquivo;

        if ($caminhoOrigem !== $caminhoDestino) {
            copy($caminhoOrigem, $caminhoDestino);
        }

        $mediaItem->setCaminhoLocal($caminhoDestino);
        $mediaItem->transicionarPara(StatusMediaItem::DISTRIBUIDO_LOCAL);
        $this->mediaItemRepository->salvar($mediaItem);

        return $mediaItem;
    }
}
