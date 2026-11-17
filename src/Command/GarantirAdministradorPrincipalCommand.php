<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\Usuario\GarantirAdministradorPrincipalService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:usuario:garantir-administrador',
    description: 'Garante que o usuário principal seja administrador do sistema',
)]
final class GarantirAdministradorPrincipalCommand extends Command
{
    public function __construct(
        private readonly GarantirAdministradorPrincipalService $garantirAdministrador,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption(
            'email',
            null,
            InputOption::VALUE_REQUIRED,
            'E-mail do administrador',
            GarantirAdministradorPrincipalService::EMAIL_PRINCIPAL,
        );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $email = (string) $input->getOption('email');
        $usuario = $this->garantirAdministrador->executar($email);
        $io->success(sprintf(
            'Usuário %s (%s) agora é administrador.',
            $usuario->getNomeCompleto(),
            $usuario->getEmail(),
        ));

        return Command::SUCCESS;
    }
}
