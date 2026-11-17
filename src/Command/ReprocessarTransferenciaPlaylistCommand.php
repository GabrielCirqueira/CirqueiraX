<?php

declare(strict_types=1);

namespace App\Command;

use App\Message\CasarFaixasTransferenciaMessage;
use App\Repository\ItemTransferenciaPlaylistRepository;
use App\Repository\TransferenciaPlaylistRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsCommand(
    name: 'app:transferencia-playlist:reprocessar-casamento',
    description: 'Recoloca uma transferência em casamento e enfileira o processamento das faixas pendentes',
)]
final class ReprocessarTransferenciaPlaylistCommand extends Command
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
        $this->addArgument('uuid', InputArgument::REQUIRED);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $uuid = (string) $input->getArgument('uuid');
        $transferencia = $this->transferenciaRepository->buscarPorUuid($uuid);
        if (null === $transferencia) {
            $output->writeln('<error>Transferência não encontrada.</error>');

            return Command::FAILURE;
        }

        $contagem = $this->itemRepository->contarPorStatus($transferencia);
        $transferencia->iniciarCasamento();
        $transferencia->atualizarContadores(
            $contagem['total'],
            $contagem['casadas'],
            $contagem['duvidosas'],
            $contagem['naoEncontradas'],
            $contagem['transferidas'],
            $contagem['falhas'],
        );
        $this->transferenciaRepository->salvar($transferencia);
        $this->messageBus->dispatch(new CasarFaixasTransferenciaMessage($uuid));

        $output->writeln(sprintf(
            'Casamento reenfileirado. Pendentes: %d / %d',
            $contagem['pendentes'],
            $contagem['total'],
        ));

        return Command::SUCCESS;
    }
}
