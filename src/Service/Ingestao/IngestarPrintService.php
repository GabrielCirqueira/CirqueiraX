<?php

declare(strict_types=1);

namespace App\Service\Ingestao;

use App\DataObject\IngestarMediaDTO;
use App\DataObject\IngestarPrintDTO;
use App\Entity\MediaItem;
use App\Entity\TokenAgente;
use App\Enum\OrigemMedia;
use App\Exception\Ingestao\IngestarPrintException;
use App\Infra\Storage\ArmazenamentoLocalClient;
use App\Support\MetadataKeys;
use Symfony\Component\HttpFoundation\File\Exception\FileException;

final readonly class IngestarPrintService
{
    private const string SUBDIR_PRINTS = 'cirqueirax_prints';
    private const string EXTENSAO_FALLBACK = 'png';
    private const string FORMATO_NOME_ARQUIVO = 'print_%s_%s.%s';
    private const string FORMATO_DATA_SUFIXO = 'Ymd_His';

    public function __construct(
        private IngestarMediaService $ingestarMediaService,
        private ArmazenamentoLocalClient $armazenamentoLocalClient,
    ) {}

    public function executar(IngestarPrintDTO $dto, TokenAgente $tokenAgente): MediaItem
    {
        $arquivo = $dto->arquivo();
        if (null === $arquivo) {
            throw IngestarPrintException::arquivoDePrintNaoInformado();
        }

        $diretorioDestino = sys_get_temp_dir() . '/' . self::SUBDIR_PRINTS;
        $this->armazenamentoLocalClient->criarDiretorio($diretorioDestino);

        $extensao = $arquivo->guessExtension() ?? self::EXTENSAO_FALLBACK;
        $nomeArquivo = sprintf(self::FORMATO_NOME_ARQUIVO, date(self::FORMATO_DATA_SUFIXO), bin2hex(random_bytes(4)), $extensao);

        try {
            $arquivoMovido = $arquivo->move($diretorioDestino, $nomeArquivo);
        } catch (FileException) {
            throw IngestarPrintException::falhaAoSalvarArquivoDePrint();
        }

        $origemMedia = OrigemMedia::tryFrom($tokenAgente->origem()) ?? OrigemMedia::MANUAL;

        $extensaoNormalizada = strtolower($extensao);
        $titulo = $dto->nomeOriginal() ?: sprintf('Print %s', date('d/m/Y H:i'));

        /** @var array<string, mixed> $metadataExtra */
        $metadataExtra = array_filter([
            MetadataKeys::TITULO => $titulo,
            MetadataKeys::NOME_ORIGINAL => $dto->nomeOriginal(),
            MetadataKeys::EXTENSAO => $extensaoNormalizada,
            MetadataKeys::TIMESTAMP_CAPTURA => $dto->timestampCaptura(),
            'tipo' => 'imagem',
            'tipo_midia' => 'imagem',
            'mimetype' => 'image/' . ($extensaoNormalizada === 'jpg' ? 'jpeg' : $extensaoNormalizada),
            'agente_nome' => $tokenAgente->nome(),
            'agente_uuid' => $tokenAgente->uuid()?->toString(),
        ]);

        $metadata = array_merge($dto->metadata(), $metadataExtra);

        $caminhoTemp = $arquivoMovido->getPathname();

        $ingestarMediaDTO = new IngestarMediaDTO(
            caminhoArquivo: $caminhoTemp,
            origem: $origemMedia,
            metadata: $metadata,
        );

        $mediaItem = $this->ingestarMediaService->executar($ingestarMediaDTO);

        if (null !== $mediaItem->caminhoLocal() && $mediaItem->caminhoLocal() !== $caminhoTemp && file_exists($caminhoTemp)) {
            $this->armazenamentoLocalClient->remover($caminhoTemp);
        }

        return $mediaItem;
    }
}
