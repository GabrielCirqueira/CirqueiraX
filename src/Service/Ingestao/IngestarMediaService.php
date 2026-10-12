<?php

declare(strict_types=1);

namespace App\Service\Ingestao;

use App\DataObject\IngestarMediaDTO;
use App\Entity\MediaItem;
use App\Interface\ArmazenamentoInterface;
use App\Message\ClassificarMediaMessage;
use App\Repository\MediaItemRepository;
use App\Service\MediaItem\ExtratorMetadataService;
use App\Support\MetadataKeys;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class IngestarMediaService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private ArmazenamentoInterface $armazenamentoClient,
        private ExtratorMetadataService $extratorMetadataService,
        private MessageBusInterface $messageBus,
    ) {}

    public function executar(IngestarMediaDTO $dto): MediaItem
    {
        $caminhoArquivo = $dto->caminhoArquivo();
        $hash = $dto->hash() ?? $this->armazenamentoClient->calcularHash($caminhoArquivo);

        $metadataEnriquecida = $this->extratorMetadataService->extrair($caminhoArquivo, $dto->metadata());
        $md5 = $metadataEnriquecida[MetadataKeys::HASH_MD5] ?? null;
        $tamanho = $metadataEnriquecida[MetadataKeys::TAMANHO_BYTES] ?? null;
        $urlOriginal = $metadataEnriquecida[MetadataKeys::URL_ORIGINAL] ?? null;
        $hashVisual = $metadataEnriquecida[MetadataKeys::HASH_VISUAL] ?? null;

        $existente = $this->mediaItemRepository->buscarDuplicado(
            $hash,
            is_string($md5) ? $md5 : null,
            is_int($tamanho) ? $tamanho : null,
            is_string($urlOriginal) ? $urlOriginal : null,
            is_string($hashVisual) ? $hashVisual : null
        );

        if (null !== $existente) {
            $tentativas = ((int) ($existente->metadata()[MetadataKeys::TENTATIVAS_DUPLICADAS] ?? 0)) + 1;
            $existente->adicionarMetadata(MetadataKeys::TENTATIVAS_DUPLICADAS, $tentativas);
            $existente->adicionarMetadata(MetadataKeys::DATA_DETECCAO_DUPLICADO, (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM));

            $existente->mesclarMetadata($metadataEnriquecida);
            $this->mediaItemRepository->salvar($existente);

            return $existente;
        }

        $mediaItem = MediaItem::fromIngestaoDTO($dto, $hash);
        $mediaItem->setMetadata($metadataEnriquecida);

        $this->mediaItemRepository->salvar($mediaItem);

        if (null !== $mediaItem->uuid()) {
            $this->messageBus->dispatch(new ClassificarMediaMessage($mediaItem->uuid()->toString()));
        }

        return $mediaItem;
    }
}
