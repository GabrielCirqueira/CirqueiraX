<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\DataObject\ArquivoMidiaDTO;
use App\Entity\MediaItem;
use App\Exception\MediaItem\MediaItemException;
use App\Interface\ArmazenamentoInterface;
use App\Repository\MediaItemRepository;
use App\Support\MetadataKeys;
use App\Support\TextoUtil;

final readonly class ObterArquivoMidiaService
{
    private const string EXTENSAO_PADRAO = 'mp4';
    private const string MIME_PADRAO = 'application/octet-stream';

    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private ArmazenamentoInterface $armazenamentoClient,
    ) {}

    public function obterParaStream(string $uuid): ArquivoMidiaDTO
    {
        $mediaItem = $this->buscarMidiaValida($uuid);
        $caminhoFisico = (string) $mediaItem->caminhoLocal();
        $mimeType = $this->determinarMimeType($caminhoFisico);

        return new ArquivoMidiaDTO(
            caminhoFisico: $caminhoFisico,
            nomeArquivo: basename($caminhoFisico),
            mimeType: $mimeType,
        );
    }

    public function obterParaDownload(string $uuid): ArquivoMidiaDTO
    {
        $mediaItem = $this->buscarMidiaValida($uuid);
        $caminhoFisico = (string) $mediaItem->caminhoLocal();
        $nomeDownload = $this->gerarNomeDownload($mediaItem, $caminhoFisico);
        $mimeType = $this->determinarMimeType($caminhoFisico);

        return new ArquivoMidiaDTO(
            caminhoFisico: $caminhoFisico,
            nomeArquivo: $nomeDownload,
            mimeType: $mimeType,
        );
    }

    private function buscarMidiaValida(string $uuid): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
        if (null === $mediaItem) {
            throw MediaItemException::midiaNaoEncontradaPorUuid();
        }

        $caminho = $mediaItem->caminhoLocal();
        if (TextoUtil::estaEmBranco($caminho) || !$this->armazenamentoClient->existe((string) $caminho)) {
            throw MediaItemException::arquivoDeOrigemNaoEncontrado();
        }

        return $mediaItem;
    }

    private function gerarNomeDownload(MediaItem $mediaItem, string $caminhoFisico): string
    {
        $metadata = $mediaItem->metadata();
        $titulo = (string) ($metadata[MetadataKeys::TITULO] ?? 'video_' . $mediaItem->hash());
        $extensao = (string) ($metadata[MetadataKeys::EXTENSAO] ?? pathinfo($caminhoFisico, PATHINFO_EXTENSION) ?: self::EXTENSAO_PADRAO);

        $nomeLimpo = preg_replace('/[^\w\s\-_.]/u', '', $titulo);
        if (TextoUtil::estaEmBranco($nomeLimpo)) {
            $nomeLimpo = 'video_' . $mediaItem->hash();
        }

        return sprintf('%s.%s', trim((string) $nomeLimpo), $extensao);
    }

    private function determinarMimeType(string $caminho): string
    {
        $mimeType = @mime_content_type($caminho);
        if (false === $mimeType || TextoUtil::estaEmBranco($mimeType)) {
            return self::MIME_PADRAO;
        }

        return $mimeType;
    }
}
