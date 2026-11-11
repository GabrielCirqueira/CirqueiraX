<?php

declare(strict_types=1);

namespace App\Command;

use App\Message\BuscarFotoArtistaMessage;
use App\Repository\ArtistaCatalogoRepository;
use App\Repository\UsuarioRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsCommand(
    name: 'app:musica:buscar-fotos-artistas',
    description: 'Enfileira a busca única de foto dos artistas do catálogo que ainda não têm foto.',
)]
final class BuscarFotosArtistasCommand extends Command
{
    public function __construct(
        private readonly ArtistaCatalogoRepository $artistaRepository,
        private readonly UsuarioRepository $usuarioRepository,
        private readonly MessageBusInterface $bus,
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
            $uuids = $this->artistaRepository->listarUuidsSemFotoBuscada($usuario);
            foreach ($uuids as $uuid) {
                $this->bus->dispatch(new BuscarFotoArtistaMessage((int) $usuario->getId(), $uuid));
            }
            $io->success(sprintf('Usuário %d: %d buscas de foto enfileiradas.', (int) $usuario->getId(), count($uuids)));
        }

        return Command::SUCCESS;
    }
}
