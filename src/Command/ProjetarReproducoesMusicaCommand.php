<?php

declare(strict_types=1);

namespace App\Command;

use App\Repository\UsuarioRepository;
use App\Service\Musica\Projecao\AtualizarMusicasEfetivasProjecaoService;
use App\Service\Musica\Projecao\ProjetarReproducoesSpotifyService;
use App\Service\Musica\Projecao\ProjetarReproducoesYoutubeService;
use App\Service\Musica\VincularFaixasSpotifyAoCatalogoService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:musica:projetar-spotify',
    description: 'Carga da projeção reproducao_musical: liga as faixas do Spotify ao catálogo, projeta todas as reproduções e reprojeta o YouTube Music.',
)]
final class ProjetarReproducoesMusicaCommand extends Command
{
    public function __construct(
        private readonly VincularFaixasSpotifyAoCatalogoService $vincularFaixas,
        private readonly ProjetarReproducoesSpotifyService $projetarSpotify,
        private readonly ProjetarReproducoesYoutubeService $projetarYoutube,
        private readonly AtualizarMusicasEfetivasProjecaoService $atualizarEfetivas,
        private readonly UsuarioRepository $usuarioRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('usuario', 'u', InputOption::VALUE_REQUIRED, 'Id do usuário (sem ele, todos os usuários)')
            ->addOption('sem-vinculo', null, InputOption::VALUE_NONE, 'Pula a ligação das faixas ao catálogo');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $usuarioId = $input->getOption('usuario');
        $ids = null === $usuarioId
            ? array_map(static fn ($usuario): int => (int) $usuario->getId(), $this->usuarioRepository->findAll())
            : [(int) $usuarioId];

        foreach ($ids as $id) {
            $usuario = $this->usuarioRepository->find($id);
            if (null === $usuario) {
                continue;
            }

            $io->section(sprintf('Usuário %d', $id));

            if (!$input->getOption('sem-vinculo')) {
                $vinculadas = $this->vincularFaixas->executar($usuario, null, static fn (int $lidas, int $novas) => $io->writeln(sprintf('vínculo: %d faixas lidas, %d novas', $lidas, $novas)));
                $io->writeln(sprintf('Faixas ligadas ao catálogo: %d', $vinculadas));
            }

            $spotify = $this->projetarSpotify->executar(
                $this->usuarioRepository->find($id) ?? $usuario,
                aoConcluirLote: static fn (int $lidas, int $projetadas) => $io->writeln(sprintf('spotify: %d lidas, %d projetadas', $lidas, $projetadas)),
            );
            $usuario = $this->usuarioRepository->find($id) ?? $usuario;
            $youtube = $this->projetarYoutube->projetarTudo($usuario);
            $efetivas = $this->atualizarEfetivas->executar($usuario);

            $io->writeln(sprintf(
                'Spotify: %d lidas, %d projetadas, %d sem vínculo, %d órfãs removidas. YouTube Music: %d projetadas. Uniões aplicadas: %d.',
                $spotify['lidas'],
                $spotify['projetadas'],
                $spotify['semVinculo'],
                $spotify['removidas'],
                $youtube,
                $efetivas,
            ));
        }

        return Command::SUCCESS;
    }
}
