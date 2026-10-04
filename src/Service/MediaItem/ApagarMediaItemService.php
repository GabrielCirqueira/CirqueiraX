<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\DataObject\ApagarLoteDTO;
use App\Interface\ArmazenamentoInterface;
use App\Repository\MediaItemRepository;
use App\Support\TextoUtil;
use Psr\Log\LoggerInterface;

final readonly class ApagarMediaItemService
{
    private const string ERRO_REMOVER_ARQUIVO = 'erro_remover_arquivo_fisico';
    private const string ERRO_REMOVER_BANCO = 'erro_remover_banco_dados';

    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private ArmazenamentoInterface $armazenamentoClient,
        private LoggerInterface $logger,
    ) {}

    /**
     * @return array{removidos: list<string>, falhas: array<string, string>, total: int}
     */
    public function apagarEmLote(ApagarLoteDTO $dto): array
    {
        $removidos = [];
        $falhas = [];

        foreach ($dto->uuids() as $uuid) {
            $resultado = $this->apagarItemIndividual($uuid);
            if ($resultado['sucesso']) {
                $removidos[] = $uuid;
                continue;
            }

            if (null !== $resultado['erro']) {
                $falhas[$uuid] = $resultado['erro'];
            }
        }

        if (!empty($removidos)) {
            $this->mediaItemRepository->flush();
        }

        return [
            'removidos' => $removidos,
            'falhas' => $falhas,
            'total' => count($removidos),
        ];
    }

    /**
     * @return array{sucesso: bool, erro: string|null}
     */
    private function apagarItemIndividual(string $uuid): array
    {
        $mediaItem = $this->mediaItemRepository->buscarPorUuid($uuid);
        if (null === $mediaItem) {
            return ['sucesso' => false, 'erro' => null];
        }

        $caminhoLocal = $mediaItem->caminhoLocal();
        if (TextoUtil::naoEstaEmBranco($caminhoLocal)) {
            try {
                $this->armazenamentoClient->remover((string) $caminhoLocal);
            } catch (\Throwable $e) {
                $this->logger->error(sprintf('Falha ao remover arquivo físico da mídia "%s": %s', $uuid, $e->getMessage()));

                return ['sucesso' => false, 'erro' => self::ERRO_REMOVER_ARQUIVO];
            }
        }

        try {
            $this->mediaItemRepository->remover($mediaItem, flush: false);

            return ['sucesso' => true, 'erro' => null];
        } catch (\Throwable $e) {
            $this->logger->error(sprintf('Falha ao remover mídia do banco "%s": %s', $uuid, $e->getMessage()));

            return ['sucesso' => false, 'erro' => self::ERRO_REMOVER_BANCO];
        }
    }
}
