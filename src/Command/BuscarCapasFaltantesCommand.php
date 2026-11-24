<?php

declare(strict_types=1);

namespace App\Command;

use App\Enum\TipoImagemSpotify;
use App\Message\BuscarImagemSpotifyMessage;
use App\Repository\MusicaCatalogoRepository;
use App\Repository\ReproducaoMusicalRepository;
use App\Repository\UsuarioRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsCommand(
    name: 'app:musica:buscar-capas-faltantes',
    description: 'Enfileira a busca de capa das músicas do Spotify mais ouvidas pelo usuário que ainda não têm capa no catálogo.',
)]
final class BuscarCapasFaltantesCommand extends Command
{
    private const int LIMITE_PADRAO = 1000;
    private const int TAMANHO_LOTE = 500;
    private const int PRIORIDADE = 2;

    public function __construct(
        private readonly UsuarioRepository $usuarioRepository,
        private readonly MusicaCatalogoRepository $musicaRepository,
        private readonly ReproducaoMusicalRepository $reproducaoRepository,
        private readonly MessageBusInterface $bus,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('usuario', 'u', InputOption::VALUE_REQUIRED, 'Id do usuário')
            ->addOption('limite', 'l', InputOption::VALUE_REQUIRED, 'Quantas músicas sem capa enfileirar, das mais ouvidas para as menos', (string) self::LIMITE_PADRAO);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $usuario = $this->usuarioRepository->find((int) $input->getOption('usuario'));
        if (null === $usuario) {
            $io->error('Informe um usuário válido com --usuario.');

            return Command::FAILURE;
        }

        $uuids = $this->musicaRepository->listarMaisOuvidasSemCapa($usuario, max(1, (int) $input->getOption('limite')));
        $enfileiradas = 0;
        foreach (array_chunk($uuids, self::TAMANHO_LOTE) as $lote) {
            foreach ($this->reproducaoRepository->mapearFaixaSpotifyPorMusica($usuario, $lote) as $faixa) {
                $this->bus->dispatch(new BuscarImagemSpotifyMessage(
                    usuarioId: (int) $usuario->getId(),
                    tipo: TipoImagemSpotify::Faixa,
                    nome: $faixa['nome'],
                    artista: $faixa['artista'],
                    codigoSpotify: '' === $faixa['codigo'] ? null : $faixa['codigo'],
                    prioridade: self::PRIORIDADE,
                ));
                ++$enfileiradas;
            }
        }

        $io->success(sprintf('%d buscas de capa enfileiradas para o usuário %d.', $enfileiradas, (int) $usuario->getId()));

        return Command::SUCCESS;
    }
}
