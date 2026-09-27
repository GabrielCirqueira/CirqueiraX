<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\DataObject\ClassificarManualDTO;
use App\DataObject\IngestarMediaDTO;
use App\DataObject\ResultadoUploadDTO;
use App\DataObject\UploadManualDTO;
use App\Entity\MediaItem;
use App\Enum\OrigemMedia;
use App\Exception\MediaItem\UploadManualException;
use App\Interface\ArmazenamentoInterface;
use App\Repository\MediaItemRepository;
use App\Service\Ingestao\IngestarMediaService;
use App\Support\MetadataKeys;
use Symfony\Component\HttpFoundation\File\Exception\FileException;

final readonly class UploadManualService
{
    private const string SUBDIR_UPLOADS = 'cirqueirax_uploads';
    private const string EXTENSAO_FALLBACK = 'bin';
    private const string FORMATO_NOME_ARQUIVO = 'upload_%s_%s.%s';
    private const string FORMATO_DATA_SUFIXO = 'Ymd_His';
    private const string ALGORITMO_HASH_SHA256 = 'sha256';

    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private IngestarMediaService $ingestarMediaService,
        private ClassificarMediaItemService $classificarMediaItemService,
        private ArmazenamentoInterface $armazenamentoClient,
    ) {}

    public function executar(UploadManualDTO $dto): ResultadoUploadDTO
    {
        $arquivo = $dto->arquivo();
        if (null === $arquivo) {
            throw UploadManualException::arquivoUploadNaoInformado();
        }

        $diretorioDestino = sys_get_temp_dir() . '/' . self::SUBDIR_UPLOADS;
        $this->armazenamentoClient->criarDiretorio($diretorioDestino);

        $extensao = $arquivo->guessExtension() ?? self::EXTENSAO_FALLBACK;
        $nomeArquivo = sprintf(self::FORMATO_NOME_ARQUIVO, date(self::FORMATO_DATA_SUFIXO), bin2hex(random_bytes(4)), $extensao);

        try {
            $arquivoMovido = $arquivo->move($diretorioDestino, $nomeArquivo);
        } catch (FileException) {
            throw UploadManualException::falhaAoSalvarArquivoDeUpload();
        }

        $caminhoArquivo = $arquivoMovido->getPathname();
        try {
            $hash = $this->armazenamentoClient->calcularHash($caminhoArquivo);
        } catch (\Throwable) {
            $this->armazenamentoClient->remover($caminhoArquivo);
            throw UploadManualException::falhaAoCalcularHashDoArquivo();
        }

        $existente = $this->mediaItemRepository->buscarPorHash($hash);
        if (null !== $existente) {
            $this->armazenamentoClient->remover($caminhoArquivo);

            return new ResultadoUploadDTO(
                mediaItem: $existente,
                duplicado: true,
            );
        }

        /** @var array<string, mixed> $metadataExtra */
        $metadataExtra = array_filter([
            MetadataKeys::NOME_ORIGINAL => $dto->nomeOriginal(),
            MetadataKeys::CATEGORIA_ID_DESEJADA => $dto->categoriaId(),
        ]);
        $metadata = array_merge($dto->metadata(), $metadataExtra);

        $ingestarDTO = new IngestarMediaDTO(
            caminhoArquivo: $caminhoArquivo,
            origem: OrigemMedia::MANUAL,
            metadata: $metadata,
            hash: $hash,
        );

        $mediaItem = $this->ingestarMediaService->executar($ingestarDTO);

        if (null !== $dto->categoriaId() && '' !== trim($dto->categoriaId())) {
            $mediaItem = $this->classificarMediaItemService->classificarManualmente(
                $mediaItem->uuid()?->toString() ?? '',
                new ClassificarManualDTO($dto->categoriaId())
            );
        }

        return new ResultadoUploadDTO(
            mediaItem: $mediaItem,
            duplicado: false,
        );
    }
}
