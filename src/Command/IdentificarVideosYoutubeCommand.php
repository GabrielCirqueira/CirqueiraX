<?php

declare(strict_types=1);

namespace App\Command;

use App\Repository\UsuarioRepository;
use App\Repository\VideoYoutubeRepository;
use App\Service\IdentificacaoMusica\IdentificarPendentesYoutubeService;
use App\Service\IdentificacaoMusica\ReconfirmarRevisaoYoutubeService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:youtube:identificar',
    description: 'Identifica as músicas dos vídeos do YouTube Music (pendentes, revisão ou todos de um usuário para reidentificar).',
)]
final class IdentificarVideosYoutubeCommand extends Command
{
    public function __construct(
        private readonly IdentificarPendentesYoutubeService $identificarPendentes,
        private readonly ReconfirmarRevisaoYoutubeService $reconfirmarRevisao,
        private readonly VideoYoutubeRepository $videoRepository,
        private readonly UsuarioRepository $usuarioRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('pendentes', null, InputOption::VALUE_NONE, 'Só os vídeos ainda pendentes (padrão)')
            ->addOption('revisao', null, InputOption::VALUE_NONE, 'Reconfirma os vídeos em revisão do usuário e reidentifica os com erro da IA')
            ->addOption('todos', null, InputOption::VALUE_NONE, 'Reidentifica todos os vídeos do usuário, menos os corrigidos à mão')
            ->addOption('usuario', 'u', InputOption::VALUE_REQUIRED, 'Id do usuário (obrigatório com --todos ou --revisao)')
            ->addOption('limite', 'l', InputOption::VALUE_REQUIRED, 'Quantidade máxima de vídeos', IdentificarPendentesYoutubeService::LIMITE_POR_RODADA);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $limite = max(1, (int) $input->getOption('limite'));
        $revisao = (bool) $input->getOption('revisao');
        $todos = (bool) $input->getOption('todos');

        if (!$todos && !$revisao) {
            $this->exibir($io, $this->identificarPendentes->executar($limite));

            return Command::SUCCESS;
        }

        $usuario = $this->usuarioRepository->find((int) $input->getOption('usuario'));
        if (null === $usuario) {
            $io->error('Informe um usuário válido com --usuario para usar --todos ou --revisao.');

            return Command::INVALID;
        }

        if ($revisao) {
            $this->exibir($io, $this->reconfirmarRevisao->executar($usuario, $limite));

            return Command::SUCCESS;
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
