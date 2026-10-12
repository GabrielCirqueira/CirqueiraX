<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\Support\MetadataKeys;

final readonly class ExtratorMetadataService
{
    /**
     * Extrai metadados completos de um arquivo no sistema de arquivos local
     * (SHA-256, MD5, tamanho exato em bytes, MIME type, dimensões de imagem, fingerprint)
     * e os mescla de forma segura com os metadados contextuais existentes.
     *
     * @param array<string, mixed> $metadataExistente
     * @return array<string, mixed>
     */
    public function extrair(string $caminhoArquivo, array $metadataExistente = []): array
    {
        if ('' === $caminhoArquivo || !file_exists($caminhoArquivo) || !is_file($caminhoArquivo)) {
            return $metadataExistente;
        }

        $tamanhoBytes = (int) @filesize($caminhoArquivo);
        $sha256 = hash_file('sha256', $caminhoArquivo) ?: null;
        $md5 = hash_file('md5', $caminhoArquivo) ?: null;

        $mimeType = @mime_content_type($caminhoArquivo) ?: 'application/octet-stream';
        $extensao = strtolower((string) pathinfo($caminhoArquivo, PATHINFO_EXTENSION));

        $dimensoes = null;
        $largura = null;
        $altura = null;

        if (str_starts_with($mimeType, 'image/')) {
            $imageInfo = @getimagesize($caminhoArquivo);
            if (false !== $imageInfo) {
                $largura = $imageInfo[0] ?? null;
                $altura = $imageInfo[1] ?? null;
                if (null !== $largura && null !== $altura) {
                    $dimensoes = sprintf('%dx%d', $largura, $altura);
                }
            }
        }

        $fingerprint = null;
        if (null !== $md5) {
            $fingerprint = sprintf('%d:%s', $tamanhoBytes, $md5);
        }

        $dataCriacao = null;
        $mtime = @filemtime($caminhoArquivo);
        if (false !== $mtime && $mtime > 0) {
            $dataCriacao = (new \DateTimeImmutable("@{$mtime}"))->format(\DateTimeInterface::ATOM);
        }

        $hashVisual = null;
        if (str_starts_with($mimeType, 'image/') || str_starts_with($mimeType, 'video/')) {
            $cmd = sprintf('ffmpeg -v error -i %s -f md5 - 2>/dev/null', escapeshellarg($caminhoArquivo));
            $saida = trim((string) @shell_exec($cmd));
            if (str_starts_with($saida, 'MD5=')) {
                $hashVisual = substr($saida, 4);
            }
        }

        $novosMetadados = [
            MetadataKeys::TAMANHO_BYTES => $tamanhoBytes,
            MetadataKeys::HASH_SHA256 => $sha256,
            MetadataKeys::HASH_MD5 => $md5,
            MetadataKeys::MIME_TYPE => $mimeType,
            MetadataKeys::EXTENSAO => $extensao,
            MetadataKeys::FINGERPRINT => $fingerprint,
            MetadataKeys::HASH_VISUAL => $hashVisual,
        ];

        if (null !== $largura) {
            $novosMetadados[MetadataKeys::LARGURA] = $largura;
        }
        if (null !== $altura) {
            $novosMetadados[MetadataKeys::ALTURA] = $altura;
        }
        if (null !== $dimensoes) {
            $novosMetadados[MetadataKeys::DIMENSOES] = $dimensoes;
        }
        if (null !== $dataCriacao && !isset($metadataExistente[MetadataKeys::DATA_CRIACAO_ARQUIVO])) {
            $novosMetadados[MetadataKeys::DATA_CRIACAO_ARQUIVO] = $dataCriacao;
        }

        $novosMetadados = array_filter($novosMetadados, static fn($v) => null !== $v);

        return array_merge($novosMetadados, $metadataExistente);
    }
}
