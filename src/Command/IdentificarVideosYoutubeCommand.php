<?php

declare(strict_types=1);

namespace App\Command;

use App\Repository\UsuarioRepository;
use App\Repository\VideoYoutubeRepository;
use App\Service\IdentificacaoMusica\IdentificarPendentesYoutubeService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:youtube:identificar',
    description: 'Identifica as músicas dos vídeos do YouTube Music (pendentes, ou todos de um usuário para reidentificar).',
)]
final class IdentificarVideosYoutubeCommand extends Command
{
    public function __construct(
        private readonly IdentificarPendentesYoutubeService $identificarPendentes,
        private readonly VideoYoutubeRepository $videoRepository,
        private readonly UsuarioRepository $usuarioRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('pendentes', null, InputOption::VALUE_NONE, 'Só os vídeos ainda pendentes (padrão)')
            ->addOption('todos', null, InputOption::VALUE_NONE, 'Reidentifica todos os vídeos do usuário, menos os corrigidos à mão')
            ->addOption('usuario', 'u', InputOption::VALUE_REQUIRED, 'Id do usuário (obrigatório com --todos)')
            ->addOption('limite', 'l', InputOption::VALUE_REQUIRED, 'Quantidade máxima de vídeos', IdentificarPendentesYoutubeService::LIMITE_POR_RODADA);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $limite = max(1, (int) $input->getOption('limite'));

        if (!$input->getOption('todos')) {
            $this->exibir($io, $this->identificarPendentes->executar($limite));

            return Command::SUCCESS;
        }

        $usuario = $this->usuarioRepository->find((int) $input->getOption('usuario'));
        if (null === $usuario) {
            $io->error('Informe um usuário válido com --usuario para usar --todos.');

            return Command::INVALID;
        }

        $this->exibir($io, $this->identificarPendentes->reidentificar($this->videoRepository->listarParaReidentificar($usuario, $limite)));

        return Command::SUCCESS;
    }

    /**
     * @param array<string, int> $contagem
     */
    private function exibir(SymfonyStyle $io, array $contagem): void
    {
        if ([] === $contagem) {
            $io->writeln('Nenhum vídeo identificado.');

            return;
        }

        foreach ($contagem as $status => $quantidade) {
            $io->writeln(sprintf('%s: %d', $status, $quantidade));
        }
    }
}
