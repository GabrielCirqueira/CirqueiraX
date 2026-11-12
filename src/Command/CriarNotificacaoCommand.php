<?php

declare(strict_types=1);

namespace App\Command;

use App\DataObject\CriarNotificacaoDTO;
use App\Enum\TipoNotificacao;
use App\Exception\Notificacao\NotificacaoException;
use App\Service\Notificacao\CriarNotificacaoService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:notificacao:criar',
    description: 'Cria uma notificação de atualização do sistema para todos os usuários ou para um usuário.',
)]
final class CriarNotificacaoCommand extends Command
{
    public function __construct(
        private readonly CriarNotificacaoService $criarService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('titulo', 't', InputOption::VALUE_REQUIRED, 'Título curto da notificação')
            ->addOption('mensagem', 'm', InputOption::VALUE_REQUIRED, 'Texto da notificação (aceita quebras de linha)')
            ->addOption('tipo', null, InputOption::VALUE_REQUIRED, 'melhoria, correcao, novidade ou aviso', TipoNotificacao::Melhoria->value)
            ->addOption('usuario', 'u', InputOption::VALUE_REQUIRED, 'Id do usuário (sem ele, todos os usuários)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $tipo = TipoNotificacao::tryFrom((string) $input->getOption('tipo'));
        if (null === $tipo) {
            $io->error('Tipo inválido. Use melhoria, correcao, novidade ou aviso.');

            return Command::INVALID;
        }

        $usuario = $input->getOption('usuario');

        try {
            $total = $this->criarService->executar(new CriarNotificacaoDTO(
                tipo: $tipo,
                titulo: (string) $input->getOption('titulo'),
                mensagem: (string) $input->getOption('mensagem'),
                usuarioId: null === $usuario ? null : (int) $usuario,
            ));
        } catch (NotificacaoException $erro) {
            $io->error($erro->getMessage());

            return Command::FAILURE;
        }

        $io->success(sprintf('Notificação criada para %d usuário(s).', $total));

        return Command::SUCCESS;
    }
}
