<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Infra\GoogleFotos\GoogleFotosAPI;
use App\Repository\ContaGoogleFotosRepository;
use App\Repository\MediaItemRepository;
use App\Service\GoogleFotos\GoogleFotosOAuthService;
use App\Support\MetadataKeys;
use App\Support\TextoUtil;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:google-fotos:limpar-duplicados-franky',
    description: 'Remove do álbum no Google Fotos e restaura o status dos itens da Franky enviados indevidamente.',
)]
final class LimparDuplicadosFrankyCommand extends Command
{
    public function __construct(
        private readonly MediaItemRepository $mediaItemRepository,
        private readonly ContaGoogleFotosRepository $contaRepository,
        private readonly GoogleFotosOAuthService $oAuthService,
        private readonly GoogleFotosAPI $googleFotosApi,
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Apenas simula sem remover')
            ->addOption('desde', null, InputOption::VALUE_REQUIRED, 'Data/hora mínima de atualização (padrão: 2026-10-12 23:00:00)', '2026-10-12 23:00:00');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Limpeza de Duplicados da Franky no Google Fotos');

        $dryRun = (bool) $input->getOption('dry-run');
        $desde = (string) $input->getOption('desde');

        $conn = $this->entityManager->getConnection();
        $sql = "
            SELECT 
                HEX(uuid) as uuid_hex, 
                google_photos_media_id, 
                caminho_local,
                JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.google_photos_album_id')) as album_id,
                JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.franky_id')) as franky_id
            FROM media_item
            WHERE JSON_EXTRACT(metadata, '$.franky_id') IS NOT NULL
              AND google_photos_media_id IS NOT NULL
              AND atualizado_em >= :desde
        ";

        /** @var list<array<string, mixed>> $linhas */
        $linhas = $conn->executeQuery($sql, ['desde' => $desde])->fetchAllAssociative();

        if (empty($linhas)) {
            $io->success('Nenhum item da Franky com upload recente no Google Fotos foi encontrado.');

            return Command::SUCCESS;
        }

        $io->info(sprintf('Encontrados %d itens da Franky enviados desde %s.', count($linhas), $desde));

        // 1. Agrupar por álbum para chamar batchRemoveMediaItems
        $itensPorAlbum = [];
        foreach ($linhas as $linha) {
            $albumId = (string) ($linha['album_id'] ?? '');
            $mediaId = (string) ($linha['google_photos_media_id'] ?? '');
            if (TextoUtil::naoEstaEmBranco($albumId) && TextoUtil::naoEstaEmBranco($mediaId)) {
                $itensPorAlbum[$albumId][] = $mediaId;
            }
        }

        if (!$dryRun) {
            $conta = $this->contaRepository->buscarContaAtiva();
            if (null !== $conta) {
                try {
                    $token = $this->oAuthService->obterAccessTokenValido($conta);
                    foreach ($itensPorAlbum as $albumId => $mediaIds) {
                        $io->section(sprintf('Removendo %d itens do álbum "%s"...', count($mediaIds), $albumId));
                        $chunks = array_chunk($mediaIds, 50);
                        foreach ($chunks as $chunk) {
                            $this->googleFotosApi->removerItensDoAlbum($token, $albumId, $chunk);
                        }
                        $io->success(sprintf('Removidos com sucesso do álbum %s.', $albumId));
                    }
                } catch (\Throwable $e) {
                    $io->warning(sprintf('Aviso ao remover itens do álbum na API Google Fotos: %s', $e->getMessage()));
                }
            } else {
                $io->warning('Nenhuma conta ativa do Google Fotos configurada para remover itens dos álbuns.');
            }

            // 2. Limpar o banco de dados e arquivos baixados desnecessários
            $io->section('Limpando registros no banco e arquivos físicos rebaixados...');
            $limpos = 0;
            foreach ($linhas as $linha) {
                $uuidBin = hex2bin((string) $linha['uuid_hex']);
                if (false === $uuidBin) {
                    continue;
                }

                $mediaItem = $this->mediaItemRepository->find($uuidBin);
                if (null === $mediaItem) {
                    continue;
                }

                $caminhoLocal = $linha['caminho_local'] ?? null;
                if (is_string($caminhoLocal) && file_exists($caminhoLocal)) {
                    @unlink($caminhoLocal);
                }

                $metadata = $mediaItem->metadata();
                unset(
                    $metadata[MetadataKeys::GOOGLE_PHOTOS_ID],
                    $metadata[MetadataKeys::GOOGLE_PHOTOS_ALBUM_ID],
                    $metadata[MetadataKeys::GOOGLE_PHOTOS_UPLOADED_AT],
                    $metadata[MetadataKeys::GOOGLE_PHOTOS_FORCADO],
                    $metadata['rebaixado_em']
                );

                $mediaItem->setGoogleFotosId(null);
                $mediaItem->setCaminhoLocal(null);
                $mediaItem->setMetadata($metadata);
                $mediaItem->limparErro();
                $mediaItem->transicionarPara(StatusMediaItem::ARQUIVO_REMOVIDO);

                $this->mediaItemRepository->salvar($mediaItem);
                ++$limpos;
            }

            $io->success(sprintf('%d mídias da Franky tiveram seu status restaurado para "arquivo_removido" e desvinculadas do Google Fotos.', $limpos));
        } else {
            $io->note('Modo --dry-run: nenhuma alteração foi realizada.');
        }

        return Command::SUCCESS;
    }
}
