<?php

declare(strict_types=1);

namespace App\Command;

use App\Repository\UsuarioRepository;
use App\Service\Musica\VincularFaixasSpotifyAoCatalogoService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:musica:vincular-spotify',
    description: 'Liga cada música distinta do Spotify a uma música do catálogo (idempotente, em lotes).',
)]
final class VincularSpotifyAoCatalogoCommand extends Command
{
    public function __construct(
        private readonly VincularFaixasSpotifyAoCatalogoService $vincularFaixas,
        private readonly UsuarioRepository $usuarioRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('usuario', 'u', InputOption::VALUE_REQUIRED, 'Id do usuário (sem ele, todos os usuários)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $usuarioId = $input->getOption('usuario');
        $usuarios = null === $usuarioId ? $this->usuarioRepository->findAll() : array_filter([$this->usuarioRepository->find((int) $usuarioId)]);

        foreach ($usuarios as $usuario) {
            $id = (int) $usuario->getId();
            $total = $this->vincularFaixas->executar($usuario, null, static function (int $lidas, int $vinculadas) use ($io, $id): void {
                $io->writeln(sprintf('Usuário %d: %d músicas lidas, %d vinculadas.', $id, $lidas, $vinculadas));
            });
            $io->success(sprintf('Usuário %d: %d músicas novas vinculadas ao catálogo.', $id, $total));
        }

        return Command::SUCCESS;
    }
}
