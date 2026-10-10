<?php

declare(strict_types=1);

namespace App\Service\Distribuicao;

use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Exception\Categoria\CategoriaException;
use App\Exception\MediaItem\MediaItemException;
use App\Interface\ArmazenamentoInterface;
use App\Repository\CategoriaRepository;
use App\Repository\MediaItemRepository;
use App\Support\TextoUtil;

final readonly class DistribuirLocalService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private CategoriaRepository $categoriaRepository,
        private ArmazenamentoInterface $armazenamentoClient,
        private string $mediaStoragePath = './var/storage',
        private string $projectDir = '',
    ) {}

    public function executar(string $mediaItemUuid): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($mediaItemUuid);
        if (null === $mediaItem) {
            throw MediaItemException::midiaNaoEncontradaPorUuid();
        }

        $categoriaId = $mediaItem->categoriaId();
        if (TextoUtil::estaEmBranco($categoriaId)) {
            throw MediaItemException::categoriaDesejadaNaoDefinida();
        }

        $categoria = $this->categoriaRepository->buscarPorUuid((string) $categoriaId);
        if (null === $categoria) {
            throw CategoriaException::categoriaNaoEncontrada();
        }

        $caminhoOrigem = $mediaItem->caminhoLocal();
        if (TextoUtil::estaEmBranco($caminhoOrigem) || !file_exists((string) $caminhoOrigem)) {
            throw MediaItemException::arquivoDeOrigemNaoEncontrado();
        }

        $baseStorage = $this->resolverBaseStorage();

        $diretorioDestino = rtrim($baseStorage, '/') . '/' . trim($categoria->pastaLocal(), '/');
        $this->armazenamentoClient->criarDiretorio($diretorioDestino);

        $nomeArquivo = basename((string) $caminhoOrigem);
        $caminhoDestinoFinal = $diretorioDestino . '/' . $nomeArquivo;

        if ($caminhoOrigem !== $caminhoDestinoFinal) {
            $this->armazenamentoClient->copiar((string) $caminhoOrigem, $caminhoDestinoFinal);
        }

        $mediaItem->setCaminhoLocal($caminhoDestinoFinal);
        $mediaItem->transicionarPara(StatusMediaItem::DISTRIBUIDO_LOCAL);
        $this->mediaItemRepository->salvar($mediaItem);

        return $mediaItem;
    }

    private function resolverBaseStorage(): string
    {
        $baseStorage = str_starts_with($this->mediaStoragePath, '/')
            ? $this->mediaStoragePath
            : rtrim($this->projectDir, '/') . '/' . ltrim($this->mediaStoragePath, './');

        if (!is_dir($baseStorage) && '' !== $this->projectDir && is_dir($this->projectDir . '/var/storage')) {
            return $this->projectDir . '/var/storage';
        }

        return $baseStorage;
    }
}
