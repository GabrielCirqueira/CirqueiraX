<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\DataObject\RebaixarLoteDTO;
use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Exception\MediaItem\MediaItemException;
use App\Interface\ArmazenamentoInterface;
use App\Message\RebaixarMediaItemMessage;
use App\Repository\CategoriaRepository;
use App\Repository\MediaItemRepository;
use App\Service\Video\BaixarVideoDownloadService;
use App\Support\MetadataKeys;
use App\Support\TextoUtil;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Uid\Uuid;

final readonly class RebaixarMediaItemService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private CategoriaRepository $categoriaRepository,
        private BaixarVideoDownloadService $baixarVideoDownloadService,
        private ArmazenamentoInterface $armazenamentoClient,
        private MessageBusInterface $messageBus,
        private ?LoggerInterface $logger = null,
        private string $mediaStoragePath = './var/storage',
        private string $projectDir = '',
    ) {}

    public function rebaixarIndividual(string|Uuid $uuid): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
        if (null === $mediaItem) {
            throw MediaItemException::midiaNaoEncontradaPorUuid();
        }

        $mediaItem->limparErro();
        if ($mediaItem->status()->podeTransicionarPara(StatusMediaItem::BAIXANDO)) {
            $mediaItem->transicionarPara(StatusMediaItem::BAIXANDO);
        }
        $this->mediaItemRepository->salvar($mediaItem);

        $uuidStr = $mediaItem->uuid()?->toString() ?? (string) $uuid;
        $this->messageBus->dispatch(new RebaixarMediaItemMessage($uuidStr));

        return $mediaItem;
    }

    /**
     * @return list<MediaItem>
     */
    public function rebaixarEmLote(RebaixarLoteDTO $dto): array
    {
        $resultado = [];
        foreach ($dto->uuids() as $uuid) {
            try {
                $resultado[] = $this->rebaixarIndividual($uuid);
            } catch (\Throwable $e) {
                $this->logger?->warning('Erro ao enfileirar rebaixamento do item', [
                    'uuid' => $uuid,
                    'erro' => $e->getMessage(),
                ]);
            }
        }

        return $resultado;
    }

    public function processarRebaixamento(string $uuid): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
        if (null === $mediaItem) {
            throw MediaItemException::midiaNaoEncontradaPorUuid();
        }

        $metadata = $mediaItem->metadata();
        $urlOriginal = $metadata[MetadataKeys::URL_ORIGINAL]
            ?? ($metadata['webpage_url'] ?? ($metadata['url'] ?? null));

        if (!is_string($urlOriginal) || TextoUtil::estaEmBranco($urlOriginal)) {
            throw new \RuntimeException('URL original da mídia não encontrada nos metadados para realizar o redownload.');
        }

        $this->logger?->info('Baixando vídeo novamente via yt-dlp', [
            'uuid' => $uuid,
            'url' => $urlOriginal,
        ]);

        // Baixa o arquivo físico usando yt-dlp para a pasta de downloads
        $caminhoBaixado = $this->baixarVideoDownloadService->baixarParaStorage($urlOriginal);

        if (!file_exists($caminhoBaixado) || 0 === filesize($caminhoBaixado)) {
            throw new \RuntimeException(sprintf('Arquivo baixado não foi encontrado ou está vazio: %s', $caminhoBaixado));
        }

        // Determina o diretório de destino baseado na categoria ou histórico
        $baseStorage = $this->resolverBaseStorage();
        $categoriaId = $mediaItem->categoriaId();
        $diretorioDestino = null;

        if (TextoUtil::naoEstaEmBranco($categoriaId)) {
            $categoria = $this->categoriaRepository->buscarPorUuid((string) $categoriaId);
            if (null !== $categoria && TextoUtil::naoEstaEmBranco($categoria->pastaLocal())) {
                $diretorioDestino = rtrim($baseStorage, '/') . '/' . trim($categoria->pastaLocal(), '/');
            }
        }

        $caminhoAnterior = $metadata[MetadataKeys::CAMINHO_LOCAL_ANTERIOR] ?? null;
        if (null === $diretorioDestino && is_string($caminhoAnterior) && TextoUtil::naoEstaEmBranco($caminhoAnterior)) {
            $diretorioDestino = dirname($caminhoAnterior);
        }

        if (null === $diretorioDestino) {
            $diretorioDestino = rtrim($baseStorage, '/') . '/videos';
        }

        $this->armazenamentoClient->criarDiretorio($diretorioDestino);

        // Define o nome final do arquivo
        $nomeArquivo = basename($caminhoBaixado);
        if (is_string($caminhoAnterior) && TextoUtil::naoEstaEmBranco($caminhoAnterior)) {
            $nomeAnterior = basename($caminhoAnterior);
            if (pathinfo($nomeAnterior, PATHINFO_EXTENSION) === pathinfo($nomeArquivo, PATHINFO_EXTENSION)) {
                $nomeArquivo = $nomeAnterior;
            }
        }

        $caminhoDestinoFinal = $diretorioDestino . '/' . $nomeArquivo;

        if ($caminhoBaixado !== $caminhoDestinoFinal) {
            $this->armazenamentoClient->mover($caminhoBaixado, $caminhoDestinoFinal);
        }

        // Preservação estrita dos metadados e data para sincronização (Syncthing-Fork / Google Fotos)
        // Se a data já foi alterada pelo usuário ou existe data original, aplica touch no arquivo local
        $this->preservarDataModificacaoArquivo($caminhoDestinoFinal, $metadata, $mediaItem);

        // Atualiza a entidade mantendo todos os metadados existentes
        $metadata[MetadataKeys::TAMANHO_BYTES] = (int) @filesize($caminhoDestinoFinal);
        unset($metadata[MetadataKeys::ARQUIVO_EXPURGADO_EM]);
        $metadata['rebaixado_em'] = (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM);

        $mediaItem->setMetadata($metadata);
        $mediaItem->setCaminhoLocal($caminhoDestinoFinal);
        $mediaItem->limparErro();

        if ($mediaItem->status()->podeTransicionarPara(StatusMediaItem::CONCLUIDO)) {
            $mediaItem->transicionarPara(StatusMediaItem::CONCLUIDO);
        }

        $this->mediaItemRepository->salvar($mediaItem);

        $this->logger?->info('Vídeo rebaixado com sucesso e restaurado no storage.', [
            'uuid' => $uuid,
            'caminho' => $caminhoDestinoFinal,
            'googlePhotosJaEnviado' => $mediaItem->isEnviadoGoogleFotos(),
        ]);

        return $mediaItem;
    }

    /**
     * @param array<string, mixed> $metadata
     */
    private function preservarDataModificacaoArquivo(string $caminhoArquivo, array $metadata, MediaItem $mediaItem): void
    {
        $timestamp = null;

        // 1. Verifica se há data definida explicitamente nos metadados (ex: editada pelo usuário ou data original)
        $dataStr = $metadata[MetadataKeys::DATA] ?? ($metadata[MetadataKeys::DATA_CRIACAO_ARQUIVO] ?? null);
        if (is_string($dataStr) && TextoUtil::naoEstaEmBranco($dataStr)) {
            try {
                $dt = new \DateTimeImmutable($dataStr);
                $timestamp = $dt->getTimestamp();
            } catch (\Throwable) {
            }
        }

        // 2. Fallback para data de criação do item
        if (null === $timestamp) {
            $timestamp = $mediaItem->criadoEm()->getTimestamp();
        }

        if (null !== $timestamp && file_exists($caminhoArquivo)) {
            @touch($caminhoArquivo, $timestamp);
        }
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
