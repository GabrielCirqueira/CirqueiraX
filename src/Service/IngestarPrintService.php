<?php

declare(strict_types=1);

namespace App\Service;

use App\DataObject\IngestarMediaDTO;
use App\DataObject\IngestarPrintDTO;
use App\Entity\MediaItem;
use App\Entity\TokenAgente;
use App\Enum\OrigemMedia;
use Symfony\Component\HttpFoundation\File\Exception\FileException;

final readonly class IngestarPrintService
{
    public function __construct(
        private IngestarMediaService $ingestarMediaService,
    ) {
    }

    public function executar(IngestarPrintDTO $dto, TokenAgente $tokenAgente): MediaItem
    {
        $arquivo = $dto->arquivo();
        if (null === $arquivo) {
            throw new \DomainException('arquivo_print_obrigatorio', 400);
        }

        $diretorioDestino = sys_get_temp_dir() . '/cirqueirax_prints';
        if (!is_dir($diretorioDestino) && !mkdir($diretorioDestino, 0777, true) && !is_dir($diretorioDestino)) {
            throw new \DomainException('erro_criar_diretorio_temp', 500);
        }

        $extensao = $arquivo->guessExtension() ?? 'png';
        $nomeArquivo = sprintf('print_%s_%s.%s', date('Ymd_His'), bin2hex(random_bytes(4)), $extensao);

        try {
            $arquivoMovido = $arquivo->move($diretorioDestino, $nomeArquivo);
        } catch (FileException) {
            throw new \DomainException('erro_salvar_arquivo_print', 500);
        }

        $origemMedia = OrigemMedia::tryFrom($tokenAgente->origem()) ?? OrigemMedia::MANUAL;

        /** @var array<string, mixed> $metadataExtra */
        $metadataExtra = array_filter([
            'nome_original' => $dto->nomeOriginal(),
            'timestamp_captura' => $dto->timestampCaptura(),
            'agente_nome' => $tokenAgente->nome(),
            'agente_uuid' => $tokenAgente->uuid()?->toString(),
        ]);

        $metadata = array_merge($dto->metadata(), $metadataExtra);

        $ingestarMediaDTO = new IngestarMediaDTO(
            caminhoArquivo: $arquivoMovido->getPathname(),
            origem: $origemMedia,
            metadata: $metadata,
        );

        return $this->ingestarMediaService->executar($ingestarMediaDTO);
    }
}
