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
        private ?LoggerInterface $logger = null,
    ) {}

    public function executar(string $mediaItemUuid): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($mediaItemUuid);
        if (null === $mediaItem) {
            throw MediaItemException::midiaNaoEncontradaPorUuid();
        }

        // 1. VERIFICAÇÃO DE DUPLICIDADE: Se este item já foi enviado ao Google Fotos, nunca envia novamente
        if ($mediaItem->isEnviadoGoogleFotos()) {
            $this->logger?->info('Mídia já possui upload no Google Fotos concluído, ignorando upload repetido.', [
                'uuid' => $mediaItemUuid,
                'googlePhotosMediaId' => $mediaItem->googleFotosId(),
            ]);

            if (!$mediaItem->isFinal()) {
                $mediaItem->transicionarPara(StatusMediaItem::CONCLUIDO);
                $this->mediaItemRepository->salvar($mediaItem);
            }

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

        // 2. VERIFICAÇÃO DE DUPLICIDADE ENTRE ITENS: Verifica se outro registro com mesmo hash/MD5 já foi enviado
        $md5 = is_string($mediaItem->metadata()[MetadataKeys::HASH_MD5] ?? null)
            ? (string) $mediaItem->metadata()[MetadataKeys::HASH_MD5]
            : null;

        $outroItemComGoogle = $this->mediaItemRepository->buscarOutroItemComGoogleFotos(
            $mediaItem->hash(),
            $mediaItem->uuid(),
            $md5
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

            // Se pertencer a outra categoria com álbum diferente, associa ao álbum sem enviar os bytes novamente
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

            $mediaItem->setMetadata($metadata);
            $mediaItem->transicionarPara(StatusMediaItem::CONCLUIDO);
            $this->mediaItemRepository->salvar($mediaItem);

            return $mediaItem;
        }

        $caminhoLocal = $mediaItem->caminhoLocal();
        if (TextoUtil::estaEmBranco($caminhoLocal) || !file_exists((string) $caminhoLocal)) {
            throw MediaItemException::arquivoDeOrigemNaoEncontrado();
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
        $mediaItem->setMetadata($metadata);

        $mediaItem->transicionarPara(StatusMediaItem::CONCLUIDO);
        $this->mediaItemRepository->salvar($mediaItem);

        return $mediaItem;
    }
}
