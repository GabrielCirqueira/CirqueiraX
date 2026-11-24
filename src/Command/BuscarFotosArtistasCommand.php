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
        $this
            ->addOption('usuario', 'u', InputOption::VALUE_REQUIRED, 'Id do usuário usado para resolver código Spotify (padrão: primeiro usuário)')
            ->addOption('mais-ouvidos', null, InputOption::VALUE_REQUIRED, 'Só os N artistas sem foto mais ouvidos pelo usuário informado');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $usuarioIdOpcao = $input->getOption('usuario');
        $usuario = null === $usuarioIdOpcao
            ? ($this->usuarioRepository->findAll()[0] ?? null)
            : $this->usuarioRepository->find((int) $usuarioIdOpcao);

        if (null === $usuario) {
            $io->warning('Nenhum usuário encontrado para enfileirar buscas de foto.');

            return Command::SUCCESS;
        }

        $maisOuvidos = $input->getOption('mais-ouvidos');
        $uuids = null === $maisOuvidos
            ? $this->artistaRepository->listarUuidsSemFotoBuscada()
            : $this->artistaRepository->listarUuidsSemFotoMaisOuvidosDoUsuario($usuario, max(1, (int) $maisOuvidos));
        foreach ($uuids as $uuid) {
            $this->bus->dispatch(new BuscarFotoArtistaMessage((int) $usuario->getId(), $uuid));
        }
        $io->success(sprintf('%d buscas de foto enfileiradas (contexto usuário %d).', count($uuids), (int) $usuario->getId()));

        return Command::SUCCESS;
    }
}
