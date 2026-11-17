<?php

declare(strict_types=1);

namespace App\Command;

use App\Enum\StatusTransferenciaPlaylist;
use App\Message\CasarFaixasTransferenciaMessage;
use App\Repository\ItemTransferenciaPlaylistRepository;
use App\Repository\TransferenciaPlaylistRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsCommand(name: 'app:transferencia-playlist:debug')]
final class DebugTransferenciaPlaylistCommand extends Command
{
    public function __construct(
        private readonly ItemTransferenciaPlaylistRepository $itemRepository,
        private readonly MessageBusInterface $messageBus,
        private readonly TransferenciaPlaylistRepository $transferenciaRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('uuid', InputArgument::REQUIRED)
            ->addOption('reprocessar', null, InputOption::VALUE_NONE);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $uuid = (string) $input->getArgument('uuid');
        $transferencia = $this->transferenciaRepository->buscarPorUuid($uuid);
        if (null === $transferencia) {
            $output->writeln('<error>nao encontrada</error>');

            return Command::FAILURE;
        }

        $pendentes = $this->itemRepository->listarPendentes($transferencia, 5);
        $contagem = $this->itemRepository->contarPorStatus($transferencia);
        $output->writeln('status='.$transferencia->status()->value);
        $output->writeln('totalFaixas='.$transferencia->totalFaixas());
        $output->writeln('pendentesQuery='.count($pendentes));
        $output->writeln('contagem='.json_encode($contagem));

        if ($input->getOption('reprocessar')) {
            $transferencia->iniciarCasamento();
            $this->transferenciaRepository->salvar($transferencia);
            $this->messageBus->dispatch(new CasarFaixasTransferenciaMessage($uuid));
            $output->writeln('reprocessar=ok status='.StatusTransferenciaPlaylist::Casando->value);
        }

        return Command::SUCCESS;
    }
}
