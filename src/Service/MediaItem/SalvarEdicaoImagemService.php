<?php

declare(strict_types=1);

namespace App\Service\MediaItem;

use App\DataObject\ClassificarManualDTO;
use App\DataObject\IngestarMediaDTO;
use App\DataObject\SalvarEdicaoImagemDTO;
use App\Entity\MediaItem;
use App\Enum\OrigemMedia;
use App\Exception\MediaItem\EdicaoImagemException;
use App\Interface\ArmazenamentoInterface;
use App\Repository\MediaItemRepository;
use App\Service\Ingestao\IngestarMediaService;
use App\Support\MetadataKeys;
use App\Support\TextoUtil;
use DateTimeImmutable;
use DateTimeZone;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final readonly class SalvarEdicaoImagemService
{
    private const string SUBDIR_EDICOES = 'cirqueirax_edicoes';
    private const string EXTENSAO_PADRAO = 'png';
    private const string FORMATO_NOME_ARQUIVO = 'edicao_%s_%s.%s';
    private const string FORMATO_NOME_PADRAO = 'edicao_%s.%s';
    private const string FORMATO_DATA_SUFIXO = 'Ymd_His';
    private const string FORMATO_DATA = 'Y-m-d';
    private const string FORMATO_HORARIO = 'H:i:s';
    private const string FUSO_HORARIO_EXIBICAO = 'America/Sao_Paulo';
    private const int BYTES_SUFIXO_ALEATORIO = 4;

    public function __construct(
        private MediaItemRepository $mediaItemRepository,
        private IngestarMediaService $ingestarMediaService,
        private ClassificarMediaItemService $classificarMediaItemService,
        private ArmazenamentoInterface $armazenamentoClient,
    ) {}

    public function executar(SalvarEdicaoImagemDTO $dto): MediaItem
    {
        $arquivo = $dto->arquivo();
        if (null === $arquivo) {
            throw EdicaoImagemException::arquivoDaEdicaoNaoInformado();
        }

        $midiaOrigem = $this->buscarMidiaOrigem($dto->mediaItemOrigemUuid());
        $extensao = $arquivo->guessExtension() ?? self::EXTENSAO_PADRAO;
        $caminhoArquivo = $this->moverParaDiretorioTemporario($arquivo, $extensao);

        $mediaItem = $this->ingestarMediaService->executar(new IngestarMediaDTO(
            caminhoArquivo: $caminhoArquivo,
            origem: $midiaOrigem?->origem() ?? OrigemMedia::MANUAL,
            metadata: $this->montarMetadata($dto, $midiaOrigem, $extensao),
        ));

        if (TextoUtil::estaEmBranco($dto->categoriaId())) {
            return $mediaItem;
        }

        return $this->classificarMediaItemService->classificarManualmente(
            $mediaItem->uuid()?->toString() ?? '',
            new ClassificarManualDTO((string) $dto->categoriaId())
        );
    }

    private function buscarMidiaOrigem(?string $uuid): ?MediaItem
    {
        if (null === $uuid) {
            return null;
        }

        $midiaOrigem = $this->mediaItemRepository->buscarPorUuid($uuid);
        if (null === $midiaOrigem) {
            throw EdicaoImagemException::midiaDeOrigemNaoEncontrada();
        }

        if (!$midiaOrigem->isEditavelComoImagem()) {
            throw EdicaoImagemException::midiaDeOrigemNaoEditavel();
        }

        return $midiaOrigem;
    }

    private function moverParaDiretorioTemporario(UploadedFile $arquivo, string $extensao): string
    {
        $diretorioDestino = sys_get_temp_dir() . '/' . self::SUBDIR_EDICOES;
        $this->armazenamentoClient->criarDiretorio($diretorioDestino);

        $nomeArquivo = sprintf(
            self::FORMATO_NOME_ARQUIVO,
            date(self::FORMATO_DATA_SUFIXO),
            bin2hex(random_bytes(self::BYTES_SUFIXO_ALEATORIO)),
            $extensao
        );

        try {
            return $arquivo->move($diretorioDestino, $nomeArquivo)->getPathname();
        } catch (FileException) {
            throw EdicaoImagemException::falhaAoSalvarArquivoDaEdicao();
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function montarMetadata(SalvarEdicaoImagemDTO $dto, ?MediaItem $midiaOrigem, string $extensao): array
    {
        $nomeArquivo = $dto->nomeArquivo() ?? sprintf(self::FORMATO_NOME_PADRAO, date(self::FORMATO_DATA_SUFIXO), $extensao);

        $metadata = [
            MetadataKeys::NOME_ORIGINAL => $nomeArquivo,
            MetadataKeys::TITULO => pathinfo($nomeArquivo, PATHINFO_FILENAME),
        ];

        if (null === $midiaOrigem) {
            return $metadata;
        }

        $dataOrigem = DateTimeImmutable::createFromInterface($midiaOrigem->dataExibicao())
            ->setTimezone(new DateTimeZone(self::FUSO_HORARIO_EXIBICAO));

        return array_merge($metadata, [
            MetadataKeys::EDITADO_DE_UUID => $midiaOrigem->uuid()?->toString(),
            MetadataKeys::DATA => $dataOrigem->format(self::FORMATO_DATA),
            MetadataKeys::HORARIO => $dataOrigem->format(self::FORMATO_HORARIO),
        ]);
    }
}
