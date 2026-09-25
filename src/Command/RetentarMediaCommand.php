<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\MediaItemService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:media:retentar',
    description: 'Retenta o processamento de mídias com falha (status ERRO).',
)]
final class RetentarMediaCommand extends Command
{
    public function __construct(
        private readonly MediaItemService $mediaItemService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('uuid', InputArgument::OPTIONAL, 'UUID da mídia a ser reprocessada')
            ->addOption('todos', 't', InputOption::VALUE_NONE, 'Reprocessa todas as mídias com status de erro');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Reprocessador de Mídias em Erro');

        /** @var string|null $uuid */
        $uuid = $input->getArgument('uuid');
        $todos = (bool) $input->getOption('todos');

        if (null !== $uuid && '' !== trim($uuid)) {
            try {
                $mediaItem = $this->mediaItemService->retentar($uuid);
                $io->success(sprintf('Mídia "%s" enviada para reprocessamento com sucesso.', $mediaItem->uuid()?->toString()));
                $io->definitionList(
                    ['UUID' => $mediaItem->uuid()?->toString() ?? 'N/A'],
                    ['Status Atual' => $mediaItem->status()->value],
                    ['Origem' => $mediaItem->origem()->value],
                    ['Categoria ID' => $mediaItem->categoriaId() ?? 'Nenhum (será classificada)'],
                );

                return Command::SUCCESS;
            } catch (\Exception $e) {
                $io->error(sprintf('Erro ao reprocessar mídia "%s": %s', $uuid, $e->getMessage()));

                return Command::FAILURE;
            }
        }

        if ($todos) {
            try {
                $itens = $this->mediaItemService->retentarTodosComErro();
                $total = count($itens);
                if (0 === $total) {
                    $io->info('Nenhuma mídia com status de erro foi encontrada.');

                    return Command::SUCCESS;
                }

                $io->success(sprintf('Reenviadas %d mídia(s) para reprocessamento com sucesso.', $total));

                return Command::SUCCESS;
            } catch (\Exception $e) {
                $io->error('Erro ao reprocessar lote de mídias: '.$e->getMessage());

                return Command::FAILURE;
            }
        }

        $opcao = $io->choice('Nenhum parâmetro informado. Escolha uma ação:', [
            '1' => 'Reprocessar uma mídia específica por UUID',
            '2' => 'Reprocessar TODAS as mídias em estado de erro',
            '0' => 'Cancelar',
        ], '0');

        if ('1' === $opcao) {
            $uuidInformado = $io->ask('Informe o UUID da mídia');
            if (empty($uuidInformado)) {
                $io->error('UUID é obrigatório.');

                return Command::FAILURE;
            }

            try {
                $mediaItem = $this->mediaItemService->retentar($uuidInformado);
                $io->success(sprintf('Mídia "%s" enviada para reprocessamento.', $mediaItem->uuid()?->toString()));

                return Command::SUCCESS;
            } catch (\Exception $e) {
                $io->error($e->getMessage());

                return Command::FAILURE;
            }
        }

        if ('2' === $opcao) {
            try {
                $itens = $this->mediaItemService->retentarTodosComErro();
                $io->success(sprintf('Reenviadas %d mídia(s) para reprocessamento.', count($itens)));

                return Command::SUCCESS;
            } catch (\Exception $e) {
                $io->error($e->getMessage());

                return Command::FAILURE;
            }
        }

        $io->note('Operação cancelada.');

        return Command::SUCCESS;
    }
}
