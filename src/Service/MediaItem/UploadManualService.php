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

    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private IngestarMediaService $ingestarMediaService,
        private ClassificarMediaItemService $classificarMediaItemService,
        private ArmazenamentoInterface $armazenamentoClient,
        private ExtratorMetadataService $extratorMetadataService,
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

        $metadataExtraida = $this->extratorMetadataService->extrair($caminhoArquivo, $dto->metadata());
        $md5 = $metadataExtraida[MetadataKeys::HASH_MD5] ?? null;
        $hashVisual = $metadataExtraida[MetadataKeys::HASH_VISUAL] ?? null;

        $existente = $this->mediaItemRepository->buscarDuplicado(
            $hash,
            is_string($md5) ? $md5 : null,
            (int) @filesize($caminhoArquivo),
            null,
            is_string($hashVisual) ? $hashVisual : null
        );

        if (null !== $existente) {
            $this->armazenamentoClient->remover($caminhoArquivo);

            $tentativas = ((int) ($existente->metadata()[MetadataKeys::TENTATIVAS_DUPLICADAS] ?? 0)) + 1;
            $existente->adicionarMetadata(MetadataKeys::TENTATIVAS_DUPLICADAS, $tentativas);
            $existente->adicionarMetadata(MetadataKeys::DATA_DETECCAO_DUPLICADO, (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM));
            $existente->mesclarMetadata($metadataExtraida);
            $this->mediaItemRepository->salvar($existente);

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
