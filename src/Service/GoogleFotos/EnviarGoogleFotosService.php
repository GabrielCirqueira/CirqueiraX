<?php

declare(strict_types=1);

namespace App\Service\GoogleFotos;

use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Exception\Categoria\CategoriaException;
use App\Exception\GoogleFotos\GoogleFotosAPIException;
use App\Exception\MediaItem\MediaItemException;
use App\Infra\GoogleFotos\GoogleFotosAPI;
use App\Repository\CategoriaRepository;
use App\Repository\ContaGoogleFotosRepository;
use App\Repository\MediaItemRepository;
use App\Service\MediaItem\RebaixarMediaItemService;
use App\Support\MetadataKeys;
use App\Support\TextoUtil;
use Psr\Log\LoggerInterface;

final readonly class EnviarGoogleFotosService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private CategoriaRepository $categoriaRepository,
        private ContaGoogleFotosRepository $contaRepository,
        private GoogleFotosOAuthService $oAuthService,
        private GoogleFotosAlbumService $albumService,
        private GoogleFotosAPI $googleFotosApi,
        private ?RebaixarMediaItemService $rebaixarMediaItemService = null,
        private ?LoggerInterface $logger = null,
    ) {}

    public function executar(string $mediaItemUuid, bool $forcarUpload = false): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($mediaItemUuid);
        if (null === $mediaItem) {
            throw MediaItemException::midiaNaoEncontradaPorUuid();
        }

        if (!$forcarUpload && $mediaItem->isEnviadoGoogleFotos()) {
            $this->logger?->info('Mídia já possui upload no Google Fotos concluído, ignorando upload repetido.', [
                'uuid' => $mediaItemUuid,
                'googlePhotosMediaId' => $mediaItem->googleFotosId(),
            ]);

            $mediaItem->limparErro();
            if (StatusMediaItem::CONCLUIDO !== $mediaItem->status()) {
                $mediaItem->transicionarPara(StatusMediaItem::CONCLUIDO);
                $this->mediaItemRepository->salvar($mediaItem);
            }

            return $mediaItem;
        }

        $metadata = $mediaItem->metadata();
        if (!$forcarUpload && (!empty($metadata['franky_id']) || !empty($metadata['importado_franky']))) {
            $this->logger?->info('Mídia originária da Franky identificada. Vídeo já existe no Google Fotos e não deve ser reenviado pelo CirqueiraX.', [
                'uuid' => $mediaItemUuid,
                'frankyId' => $metadata['franky_id'] ?? null,
            ]);

            return $mediaItem;
        }

        $categoriaId = $mediaItem->categoriaId();
        if (TextoUtil::estaEmBranco($categoriaId)) {
            throw MediaItemException::categoriaDesejadaNaoDefinida();
        }

        $categoria = $this->categoriaRepository->buscarPorUuid((string) $categoriaId);
        if (null === $categoria) {
            throw CategoriaException::categoriaNaoEncontrada();
        }

        if (!$forcarUpload) {
            $md5 = is_string($mediaItem->metadata()[MetadataKeys::HASH_MD5] ?? null)
                ? (string) $mediaItem->metadata()[MetadataKeys::HASH_MD5]
                : null;
            $hashVisual = is_string($mediaItem->metadata()[MetadataKeys::HASH_VISUAL] ?? null)
                ? (string) $mediaItem->metadata()[MetadataKeys::HASH_VISUAL]
                : null;

            $outroItemComGoogle = $this->mediaItemRepository->buscarOutroItemComGoogleFotos(
                $mediaItem->hash(),
                $mediaItem->uuid(),
                $md5,
                $hashVisual
            );

            if (null !== $outroItemComGoogle && $outroItemComGoogle->isEnviadoGoogleFotos()) {
                $googleMediaId = (string) $outroItemComGoogle->googleFotosId();
                $mediaItem->setGoogleFotosId($googleMediaId);

                $metadata = $mediaItem->metadata();
                $metadata[MetadataKeys::GOOGLE_PHOTOS_ID] = $googleMediaId;
                $metadata[MetadataKeys::DUPLICADO] = true;
                $metadata[MetadataKeys::DUPLICADO_DE_UUID] = $outroItemComGoogle->uuid()?->toString();
                $metadata[MetadataKeys::DATA_DETECCAO_DUPLICADO] = (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM);
                $metadata[MetadataKeys::GOOGLE_PHOTOS_UPLOADED_AT] = $outroItemComGoogle->metadata()[MetadataKeys::GOOGLE_PHOTOS_UPLOADED_AT]
                    ?? (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM);

                $this->logger?->info('Arquivo duplicado detectado com upload prévio no Google Fotos. Reutilizando mediaId existente.', [
                    'uuid' => $mediaItemUuid,
                    'originalUuid' => $outroItemComGoogle->uuid()?->toString(),
                    'googleMediaId' => $googleMediaId,
                ]);

                try {
                    $conta = $this->contaRepository->buscarContaAtiva();
                    if (null !== $conta) {
                        $token = $this->oAuthService->obterAccessTokenValido($conta);
                        $albumId = $this->albumService->obterOuCriarAlbumId($categoria);
                        $albumOriginal = $outroItemComGoogle->metadata()[MetadataKeys::GOOGLE_PHOTOS_ALBUM_ID] ?? null;

                        if ($albumId !== $albumOriginal && !TextoUtil::estaEmBranco($albumId)) {
                            $this->googleFotosApi->adicionarItensAoAlbum($token, $albumId, [$googleMediaId]);
                            $metadata[MetadataKeys::GOOGLE_PHOTOS_ALBUM_ID] = $albumId;
                        }
                    }
                } catch (\Throwable $e) {
                    $this->logger?->warning('Não foi possível associar item duplicado ao álbum da nova categoria', [
                        'uuid' => $mediaItemUuid,
                        'error' => $e->getMessage(),
                    ]);
                }

                $mediaItem->limparErro();
                $mediaItem->setMetadata($metadata);
                $mediaItem->transicionarPara(StatusMediaItem::CONCLUIDO);
                $this->mediaItemRepository->salvar($mediaItem);

                return $mediaItem;
            }
        }

        $caminhoLocal = $mediaItem->caminhoLocal();
        if (TextoUtil::estaEmBranco($caminhoLocal) || !file_exists((string) $caminhoLocal)) {
            $outroItem = $this->mediaItemRepository->buscarDuplicado(
                $mediaItem->hash(),
                is_string($mediaItem->metadata()[MetadataKeys::HASH_MD5] ?? null) ? (string) $mediaItem->metadata()[MetadataKeys::HASH_MD5] : null,
                $mediaItem->tamanhoBytes()
            );
            if (null !== $outroItem && !TextoUtil::estaEmBranco($outroItem->caminhoLocal()) && file_exists((string) $outroItem->caminhoLocal())) {
                $caminhoLocal = $outroItem->caminhoLocal();
                $mediaItem->setCaminhoLocal((string) $caminhoLocal);
            } else {
                $metadata = $mediaItem->metadata();
                $urlOriginal = $metadata[MetadataKeys::URL_ORIGINAL]
                    ?? ($metadata['webpage_url'] ?? ($metadata['url'] ?? null));

                if (is_string($urlOriginal) && TextoUtil::naoEstaEmBranco($urlOriginal) && null !== $this->rebaixarMediaItemService) {
                    $this->logger?->info('Arquivo físico não encontrado localmente. Tentando auto-rebaixar vídeo para envio ao Google Fotos...', [
                        'uuid' => $mediaItemUuid,
                        'url' => $urlOriginal,
                    ]);
                    try {
                        $mediaItem = $this->rebaixarMediaItemService->processarRebaixamento($mediaItemUuid);
                        $caminhoLocal = $mediaItem->caminhoLocal();
                    } catch (\Throwable $e) {
                        $this->logger?->warning('Falha ao auto-rebaixar vídeo ausente para o Google Fotos', [
                            'uuid' => $mediaItemUuid,
                            'erro' => $e->getMessage(),
                        ]);
                    }
                }

                if (TextoUtil::estaEmBranco($caminhoLocal) || !file_exists((string) $caminhoLocal)) {
                    throw MediaItemException::arquivoDeOrigemNaoEncontrado();
                }
            }
        }

        $conta = $this->contaRepository->buscarContaAtiva();
        if (null === $conta) {
            throw GoogleFotosAPIException::contaNaoEncontrada();
        }

        $token = $this->oAuthService->obterAccessTokenValido($conta);
        $albumId = $this->albumService->obterOuCriarAlbumId($categoria);

        $caminhoLocalStr = (string) $caminhoLocal;
        $mimeType = mime_content_type($caminhoLocalStr) ?: 'application/octet-stream';

        $uploadToken = $this->googleFotosApi->uploadBytes($token, $caminhoLocalStr, $mimeType);
        if (TextoUtil::estaEmBranco($uploadToken)) {
            throw GoogleFotosAPIException::falhaUploadBytes();
        }

        $descricao = sprintf(
            'CirqueiraX | Categoria: %s | Origem: %s',
            $categoria->nome(),
            $mediaItem->origem()->value
        );

        $resultado = $this->googleFotosApi->criarMediaItem($token, $uploadToken, $albumId, $descricao);

        /** @var array<int, array<string, mixed>>|null $newMediaItemResults */
        $newMediaItemResults = $resultado['newMediaItemResults'] ?? null;
        if (!is_array($newMediaItemResults) || empty($newMediaItemResults)) {
            throw GoogleFotosAPIException::falhaRespostaLote();
        }

        $primeiroResultado = $newMediaItemResults[0];
        $status = $primeiroResultado['status'] ?? null;

        if (is_array($status)) {
            $code = (int) ($status['code'] ?? 0);
            $message = (string) ($status['message'] ?? '');
            if (0 !== $code && 'Success' !== $message && 'OK' !== $message) {
                $erroMsg = '' !== $message ? $message : sprintf('Código de erro HTTP/API %d', $code);
                throw GoogleFotosAPIException::falhaBatchItem($erroMsg);
            }
        }

        $googleMediaId = (string) ($primeiroResultado['mediaItem']['id'] ?? '');
        if (TextoUtil::estaEmBranco($googleMediaId)) {
            throw GoogleFotosAPIException::mediaIdNaoRetornado();
        }

        $mediaItem->setGoogleFotosId($googleMediaId);

        $metadata = $mediaItem->metadata();
        $metadata[MetadataKeys::GOOGLE_PHOTOS_ID] = $googleMediaId;
        $metadata[MetadataKeys::GOOGLE_PHOTOS_ALBUM_ID] = $albumId;
        $metadata[MetadataKeys::GOOGLE_PHOTOS_UPLOADED_AT] = (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM);
        if ($forcarUpload) {
            $metadata[MetadataKeys::GOOGLE_PHOTOS_FORCADO] = true;
        }
        $mediaItem->setMetadata($metadata);

        $mediaItem->limparErro();
        $mediaItem->transicionarPara(StatusMediaItem::CONCLUIDO);
        $this->mediaItemRepository->salvar($mediaItem);

        return $mediaItem;
    }
}
