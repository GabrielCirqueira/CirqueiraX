<?php

declare(strict_types=1);

namespace App\Command;

use App\Repository\MediaItemRepository;
use App\Service\MediaItem\ExtratorMetadataService;
use App\Support\MetadataKeys;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:media:indexar-metadados',
    description: 'Indexa e enriquece metadados (MD5, SHA-256, dimensões, Google Photos) de todas as mídias para deduplicação.',
)]
final class IndexarMetadadosMediaCommand extends Command
{
    public function __construct(
        private readonly MediaItemRepository $mediaItemRepository,
        private readonly ExtratorMetadataService $extratorMetadataService,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Indexação e Enriquecimento de Metadados de Mídias');

        $itens = $this->mediaItemRepository->findAll();
        $total = count($itens);

        $io->info(sprintf('Analisando %d mídias registradas no banco de dados...', $total));

        $atualizados = 0;
        $comArquivoLocal = 0;
        $comGoogleFotos = 0;

        foreach ($itens as $item) {
            $caminhoLocal = $item->caminhoLocal();
            $metadataAtual = $item->metadata();
            $modificado = false;

            if (null !== $caminhoLocal && '' !== $caminhoLocal && file_exists($caminhoLocal)) {
                $comArquivoLocal++;
                $novaMetadata = $this->extratorMetadataService->extrair($caminhoLocal, $metadataAtual);

                if ($novaMetadata !== $metadataAtual) {
                    $item->setMetadata($novaMetadata);
                    $metadataAtual = $novaMetadata;
                    $modificado = true;
                }
            }

            if ($item->isEnviadoGoogleFotos()) {
                $comGoogleFotos++;
                if (!isset($metadataAtual[MetadataKeys::GOOGLE_PHOTOS_ID])) {
                    $item->adicionarMetadata(MetadataKeys::GOOGLE_PHOTOS_ID, $item->googleFotosId());
                    $modificado = true;
                }
            }

            if (!isset($metadataAtual[MetadataKeys::HASH_SHA256])) {
                $item->adicionarMetadata(MetadataKeys::HASH_SHA256, $item->hash());
                $modificado = true;
            }

            if ($modificado) {
                $atualizados++;
            }
        }

        $this->mediaItemRepository->flush();

        $io->success(sprintf(
            'Indexação concluída! %d/%d mídias enriquecidas com metadados para deduplicação. (Arquivos locais: %d | Google Fotos: %d)',
            $atualizados,
            $total,
            $comArquivoLocal,
            $comGoogleFotos
        ));

        return Command::SUCCESS;
    }
}
