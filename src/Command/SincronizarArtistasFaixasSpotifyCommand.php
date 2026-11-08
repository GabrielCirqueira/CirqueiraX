<?php

declare(strict_types=1);

namespace App\Command;

use App\Repository\ContaSpotifyRepository;
use App\Repository\ArtistaFaixaSpotifyRepository;
use App\Service\Spotify\SincronizarArtistasFaixasSpotifyService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:spotify:artistas-faixas',
    description: 'Busca no Spotify todos os artistas das músicas já registradas (participações incluídas).',
)]
final class SincronizarArtistasFaixasSpotifyCommand extends Command
{
    public function __construct(
        private readonly SincronizarArtistasFaixasSpotifyService $sincronizarArtistasFaixasService,
        private readonly ContaSpotifyRepository $contaSpotifyRepository,
        private readonly ArtistaFaixaSpotifyRepository $artistaFaixaRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('limite', 'l', InputOption::VALUE_REQUIRED, 'Quantidade de músicas por conta', SincronizarArtistasFaixasSpotifyService::LIMITE_PADRAO);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $limite = max(1, (int) $input->getOption('limite'));

        foreach ($this->contaSpotifyRepository->listarConectadas() as $conta) {
            $processadas = $this->sincronizarArtistasFaixasService->executarParaConta($conta, $limite);
            $restantes = $this->artistaFaixaRepository->contarFaixasSemArtistas($conta->usuario());
            $io->writeln(sprintf('Conta %s: %d músicas processadas, %d restantes.', $conta->uuid()->toRfc4122(), $processadas, $restantes));
        }

        return Command::SUCCESS;
    }
}
