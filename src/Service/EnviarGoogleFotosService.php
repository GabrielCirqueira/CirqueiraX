<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Repository\CategoriaRepository;
use App\Repository\ContaGoogleFotosRepository;
use App\Repository\MediaItemRepository;
use Symfony\Component\Uid\Uuid;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final readonly class EnviarGoogleFotosService
{
    private const UPLOAD_BYTES_URL = 'https://photoslibrary.googleapis.com/v1/uploads';
    private const BATCH_CREATE_URL = 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate';

    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private CategoriaRepository $categoriaRepository,
        private ContaGoogleFotosRepository $contaRepository,
        private GoogleFotosOAuthService $oauthService,
        private GoogleFotosAlbumService $albumService,
        private HttpClientInterface $httpClient,
    ) {
    }

    public function executar(string|Uuid $uuid): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
        if (null === $mediaItem) {
            throw new \DomainException('media_item_nao_encontrado', 404);
        }

        if (StatusMediaItem::CONCLUIDO === $mediaItem->status()) {
            return $mediaItem;
        }

        if (null === $mediaItem->categoriaId()) {
            throw new \DomainException('categoria_nao_definida', 400);
        }

        $categoria = $this->categoriaRepository->buscarPorUuid($mediaItem->categoriaId());
        if (null === $categoria) {
            throw new \DomainException('categoria_nao_encontrada', 404);
        }

        $caminhoLocal = $mediaItem->caminhoLocal();
        if (null === $caminhoLocal || !file_exists($caminhoLocal)) {
            throw new \DomainException('arquivo_origem_nao_encontrado', 404);
        }

        $conta = $this->contaRepository->buscarContaPrincipal();
        if (null === $conta) {
            throw new \DomainException('conta_google_fotos_nao_encontrada', 404);
        }

        $mediaItem->transicionarPara(StatusMediaItem::ENVIANDO_GOOGLE_FOTOS);
        $this->mediaItemRepository->salvar($mediaItem);

        $token = $this->oauthService->obterAccessTokenValido($conta);
        $albumId = $this->albumService->criarOuObter($categoria, $conta);

        $mimeType = mime_content_type($caminhoLocal) ?: 'application/octet-stream';
        $stream = fopen($caminhoLocal, 'r');

        $uploadResponse = $this->httpClient->request('POST', self::UPLOAD_BYTES_URL, [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/octet-stream',
                'X-Goog-Upload-Content-Type' => $mimeType,
                'X-Goog-Upload-Protocol' => 'raw',
            ],
            'body' => $stream,
        ]);

        $uploadToken = $uploadResponse->getContent();
        if (empty($uploadToken)) {
            throw new \DomainException('erro_upload_bytes_google', 400);
        }

        $batchResponse = $this->httpClient->request('POST', self::BATCH_CREATE_URL, [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'albumId' => $albumId,
                'newMediaItems' => [
                    [
                        'description' => basename($caminhoLocal),
                        'simpleMediaItem' => [
                            'uploadToken' => trim($uploadToken),
                        ],
                    ],
                ],
            ],
        ]);

        $dadosBatch = $batchResponse->toArray();
        $resultadoItem = $dadosBatch['newMediaItemResults'][0] ?? null;

        if (null === $resultadoItem) {
            throw new \DomainException('erro_resposta_lote_google_fotos', 400);
        }

        $statusCodigo = $resultadoItem['status']['code'] ?? 0;
        if (0 !== $statusCodigo) {
            throw new \DomainException('falha_upload_batch_google', 400);
        }

        $mediaId = $resultadoItem['mediaItem']['id'] ?? null;
        if (empty($mediaId) || !is_string($mediaId)) {
            throw new \DomainException('erro_gravar_media_id_google', 400);
        }

        $mediaItem->setGooglePhotosMediaId($mediaId);
        $mediaItem->transicionarPara(StatusMediaItem::CONCLUIDO);
        $this->mediaItemRepository->salvar($mediaItem);

        return $mediaItem;
    }
}
