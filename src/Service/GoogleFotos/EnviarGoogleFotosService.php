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
use App\Support\TextoUtil;

final readonly class EnviarGoogleFotosService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private CategoriaRepository $categoriaRepository,
        private ContaGoogleFotosRepository $contaRepository,
        private GoogleFotosOAuthService $oAuthService,
        private GoogleFotosAlbumService $albumService,
        private GoogleFotosAPI $googleFotosApi,
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
            if (0 !== $code && 'Success' !== $message && 'OK' !== $message && '' !== $message) {
                throw GoogleFotosAPIException::falhaBatchItem('' !== $message ? $message : sprintf('Código de erro HTTP/API %d', $code));
            }
        }

        $googleMediaId = (string) ($primeiroResultado['mediaItem']['id'] ?? '');
        if (TextoUtil::estaEmBranco($googleMediaId)) {
            throw GoogleFotosAPIException::mediaIdNaoRetornado();
        }

        $mediaItem->setGoogleFotosId($googleMediaId);
        $mediaItem->transicionarPara(StatusMediaItem::CONCLUIDO);
        $this->mediaItemRepository->salvar($mediaItem);

        return $mediaItem;
    }
}
