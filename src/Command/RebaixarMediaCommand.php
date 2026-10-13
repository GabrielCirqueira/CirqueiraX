<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\MediaItem;
use App\Enum\StatusMediaItem;
use App\Repository\MediaItemRepository;
use App\Service\MediaItem\RebaixarMediaItemService;
use App\Support\MetadataKeys;
use App\Support\TextoUtil;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:media:rebaixar',
    description: 'Redownload (rebaixar) de mídias a partir da URL original gravada nos metadados.',
)]
final class RebaixarMediaCommand extends Command
{
    public function __construct(
        private readonly RebaixarMediaItemService $rebaixarMediaItemService,
        private readonly MediaItemRepository $mediaItemRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('uuid', InputArgument::OPTIONAL, 'UUID da mídia para rebaixar')
            ->addOption('todos-erros', null, InputOption::VALUE_NONE, 'Rebaixa todas as mídias com status de erro que possuem URL original')
            ->addOption('sem-arquivo', null, InputOption::VALUE_NONE, 'Rebaixa mídias cujo arquivo físico não existe no disco');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Rebaixador de Vídeos CirqueiraX');

        /** @var string|null $uuid */
        $uuid = $input->getArgument('uuid');
        $todosErros = (bool) $input->getOption('todos-erros');
        $semArquivo = (bool) $input->getOption('sem-arquivo');

        if (null !== $uuid && '' !== trim($uuid)) {
            $io->info(sprintf('Rebaixando mídia "%s"...', $uuid));
            try {
                $item = $this->rebaixarMediaItemService->processarRebaixamento($uuid);
                $io->success(sprintf('Mídia "%s" rebaixada com sucesso para "%s".', $uuid, $item->caminhoLocal()));

                return Command::SUCCESS;
            } catch (\Throwable $e) {
                $io->error(sprintf('Falha ao rebaixar mídia "%s": %s', $uuid, $e->getMessage()));

                return Command::FAILURE;
            }
        }

        if ($todosErros || $semArquivo) {
            $qb = $this->mediaItemRepository->createQueryBuilder('m');

            if ($todosErros) {
                $qb->andWhere('m.status = :statusErro')
                    ->setParameter('statusErro', StatusMediaItem::ERRO);
            }

            /** @var list<MediaItem> $itens */
            $itens = $qb->getQuery()->getResult();
            $candidatos = [];

            foreach ($itens as $item) {
                $metadata = $item->metadata();
                $urlOriginal = $metadata[MetadataKeys::URL_ORIGINAL]
                    ?? ($metadata['webpage_url'] ?? ($metadata['url'] ?? null));

                if (!is_string($urlOriginal) || TextoUtil::estaEmBranco($urlOriginal)) {
                    continue;
                }

                if ($semArquivo) {
                    $caminho = $item->caminhoLocal();
                    if (TextoUtil::naoEstaEmBranco($caminho) && file_exists((string) $caminho)) {
                        continue;
                    }
                }

                $candidatos[] = $item;
            }

            $total = count($candidatos);
            $io->info(sprintf('Encontradas %d mídias aptas para rebaixamento.', $total));

            $sucessos = 0;
            $erros = 0;

            foreach ($candidatos as $idx => $item) {
                $itemUuid = $item->uuid()?->toString();
                if (null === $itemUuid) {
                    continue;
                }

                $io->write(sprintf('[%d/%d] Rebaixando %s... ', $idx + 1, $total, $itemUuid));

                try {
                    $this->rebaixarMediaItemService->processarRebaixamento($itemUuid);
                    $io->writeln('<info>OK</info>');
                    ++$sucessos;
                } catch (\Throwable $e) {
                    $io->writeln(sprintf('<error>ERRO: %s</error>', $e->getMessage()));
                    ++$erros;
                }
            }

            $io->success(sprintf('Concluído: %d rebaixadas com sucesso, %d erros.', $sucessos, $erros));

            return Command::SUCCESS;
        }

        $io->warning('Informe o UUID ou use as opções --todos-erros / --sem-arquivo.');

        return Command::INVALID;
    }
}
