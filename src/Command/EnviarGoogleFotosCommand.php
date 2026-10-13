<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Repository\MediaItemRepository;
use App\Service\GoogleFotos\EnviarGoogleFotosService;
use App\Support\TextoUtil;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:google-fotos:enviar',
    description: 'Envia mídias para o Google Fotos sincronizado com seus respectivos álbuns.',
)]
final class EnviarGoogleFotosCommand extends Command
{
    public function __construct(
        private readonly EnviarGoogleFotosService $enviarGoogleFotosService,
        private readonly MediaItemRepository $mediaItemRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('uuid', InputArgument::OPTIONAL, 'UUID da mídia a ser enviada')
            ->addOption('forcar', 'f', InputOption::VALUE_NONE, 'Força o upload mesmo que já tenha sido enviada anteriormente')
            ->addOption('pendentes', 'p', InputOption::VALUE_NONE, 'Envia todas as mídias categorizadas que ainda não foram enviadas ao Google Fotos');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Sincronizador Google Fotos');

        /** @var string|null $uuid */
        $uuid = $input->getArgument('uuid');
        $forcar = (bool) $input->getOption('forcar');
        $pendentes = (bool) $input->getOption('pendentes');

        if (null !== $uuid && '' !== trim($uuid)) {
            $io->info(sprintf('Enviando mídia "%s" ao Google Fotos...', $uuid));
            try {
                $item = $this->enviarGoogleFotosService->executar($uuid, forcarUpload: $forcar);
                $io->success(sprintf(
                    'Mídia enviada com sucesso! MediaID Google Fotos: %s',
                    $item->googleFotosId() ?? 'N/A'
                ));

                return Command::SUCCESS;
            } catch (\Throwable $e) {
                $io->error(sprintf('Falha ao enviar mídia "%s": %s', $uuid, $e->getMessage()));

                return Command::FAILURE;
            }
        }

        if ($pendentes) {
            $qb = $this->mediaItemRepository->createQueryBuilder('m');
            $qb->andWhere('m.categoriaId IS NOT NULL')
                ->andWhere('m.googlePhotosMediaId IS NULL')
                ->andWhere('m.status != :statusErro')
                ->setParameter('statusErro', StatusMediaItem::ERRO);

            /** @var list<MediaItem> $itens */
            $itens = $qb->getQuery()->getResult();
            $total = count($itens);

            $io->info(sprintf('Encontradas %d mídias pendentes de upload.', $total));

            $sucessos = 0;
            $erros = 0;

            foreach ($itens as $idx => $item) {
                $itemUuid = $item->uuid()?->toString();
                if (null === $itemUuid) {
                    continue;
                }

                $io->write(sprintf('[%d/%d] Enviando %s... ', $idx + 1, $total, $itemUuid));

                try {
                    $this->enviarGoogleFotosService->executar($itemUuid, forcarUpload: $forcar);
                    $io->writeln('<info>OK</info>');
                    ++$sucessos;
                } catch (\Throwable $e) {
                    $io->writeln(sprintf('<error>ERRO: %s</error>', $e->getMessage()));
                    ++$erros;
                }
            }

            $io->success(sprintf('Concluído: %d enviadas com sucesso, %d erros.', $sucessos, $erros));

            return Command::SUCCESS;
        }

        $io->warning('Informe o UUID da mídia ou use a opção --pendentes.');

        return Command::INVALID;
    }
}
