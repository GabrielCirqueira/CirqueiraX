<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\DataObject\CategorizarLoteDTO;
use App\DataObject\ClassificarManualDTO;
use App\Entity\Categoria;
use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Exception\MediaItem\MediaItemException;
use App\Infra\GoogleFotos\GoogleFotosAPI;
use App\Interface\ArmazenamentoInterface;
use App\Message\DistribuirLocalMessage;
use App\Message\EnviarGoogleFotosMessage;
use App\Repository\CategoriaRepository;
use App\Repository\ContaGoogleFotosRepository;
use App\Repository\MediaItemRepository;
use App\Service\Categoria\CategoriaService;
use App\Service\GoogleFotos\GoogleFotosAlbumService;
use App\Service\GoogleFotos\GoogleFotosOAuthService;
use App\Support\TextoUtil;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Uid\Uuid;

final readonly class ClassificarMediaItemService
{
    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private CategoriaRepository $categoriaRepository,
        private CategoriaService $categoriaService,
        private ArmazenamentoInterface $armazenamentoClient,
        private ContaGoogleFotosRepository $contaRepository,
        private GoogleFotosOAuthService $oAuthService,
        private GoogleFotosAlbumService $albumService,
        private GoogleFotosAPI $googleFotosApi,
        private MessageBusInterface $messageBus,
        private string $mediaStoragePath = './var/storage',
        private string $projectDir = '',
    ) {}

    public function classificarManualmente(string|Uuid $uuid, ClassificarManualDTO $dto): MediaItem
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
        if (null === $mediaItem) {
            throw MediaItemException::midiaNaoEncontradaPorUuid();
        }

        $categoriaNova = $this->categoriaService->buscarPorUuid($dto->categoriaId());
        $categoriaAntigaId = $mediaItem->categoriaId();

        if ($categoriaAntigaId === $categoriaNova->uuid()?->toString()) {
            return $mediaItem;
        }

        $statusAtual = $mediaItem->status();
        $jaProcessado = StatusMediaItem::CONCLUIDO === $statusAtual || StatusMediaItem::DISTRIBUIDO_LOCAL === $statusAtual;

        if ($jaProcessado) {
            $this->moverArquivoLocalParaNovaCategoria($mediaItem, $categoriaNova);
            $this->trocarAlbumGoogleFotosParaNovaCategoria($mediaItem, $categoriaAntigaId, $categoriaNova);

            $mediaItem->classificarComo($categoriaNova);
            $this->mediaItemRepository->salvar($mediaItem);

            return $mediaItem;
        }

        $mediaItem->classificarComo($categoriaNova);
        $this->mediaItemRepository->salvar($mediaItem);

        $this->despacharProcessamentoPósClassificacao($mediaItem);

        return $mediaItem;
    }

    /**
     * @return list<MediaItem>
     */
    public function classificarEmLote(CategorizarLoteDTO $dto): array
    {
        $resultado = [];
        foreach ($dto->uuids() as $uuid) {
            try {
                $resultado[] = $this->classificarManualmente($uuid, new ClassificarManualDTO($dto->categoriaId()));
            } catch (\Throwable) {
                // Silently skip item failure in batch to remain resilient
                continue;
            }
        }

        return $resultado;
    }

    public function despacharProcessamentoPósClassificacao(MediaItem $mediaItem): void
    {
        if (null !== $mediaItem->uuid()) {
            $mediaUuidStr = $mediaItem->uuid()->toString();
            $this->messageBus->dispatch(new DistribuirLocalMessage($mediaUuidStr));
            $this->messageBus->dispatch(new EnviarGoogleFotosMessage($mediaUuidStr));
        }
    }

    private function moverArquivoLocalParaNovaCategoria(MediaItem $mediaItem, Categoria $categoriaNova): void
    {
        $caminhoLocal = $mediaItem->caminhoLocal();
        if (TextoUtil::estaEmBranco($caminhoLocal) || !$this->armazenamentoClient->existe((string) $caminhoLocal)) {
            return;
        }

        $baseStorage = $this->resolverBaseStorage();

        $diretorioDestino = rtrim($baseStorage, '/') . '/' . trim($categoriaNova->pastaLocal(), '/');
        $this->armazenamentoClient->criarDiretorio($diretorioDestino);

        $nomeArquivo = basename((string) $caminhoLocal);
        $caminhoDestinoFinal = $diretorioDestino . '/' . $nomeArquivo;

        if ($caminhoLocal !== $caminhoDestinoFinal) {
            $this->armazenamentoClient->mover((string) $caminhoLocal, $caminhoDestinoFinal);
            $mediaItem->setCaminhoLocal($caminhoDestinoFinal);
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

    private function trocarAlbumGoogleFotosParaNovaCategoria(
        MediaItem $mediaItem,
        ?string $categoriaAntigaId,
        Categoria $categoriaNova,
    ): void {
        $googleMediaId = $mediaItem->googleFotosId();
        if (TextoUtil::estaEmBranco($googleMediaId)) {
            return;
        }

        $conta = $this->contaRepository->buscarContaAtiva();
        if (null === $conta) {
            return;
        }

        try {
            $token = $this->oAuthService->obterAccessTokenValido($conta);
            $novoAlbumId = $this->albumService->obterOuCriarAlbumId($categoriaNova);

            $this->googleFotosApi->adicionarItensAoAlbum($token, $novoAlbumId, [(string) $googleMediaId]);

            if (!TextoUtil::estaEmBranco($categoriaAntigaId)) {
                $categoriaAntiga = $this->categoriaRepository->buscarPorUuid((string) $categoriaAntigaId);
                $albumAntigoId = $categoriaAntiga?->googleFotosAlbumId();
                if (null !== $albumAntigoId && '' !== trim($albumAntigoId) && $albumAntigoId !== $novoAlbumId) {
                    $this->googleFotosApi->removerItensDoAlbum($token, $albumAntigoId, [(string) $googleMediaId]);
                }
            }
        } catch (\Throwable) {
            // Falha não bloqueia o fluxo de reclassificação
        }
    }
}
