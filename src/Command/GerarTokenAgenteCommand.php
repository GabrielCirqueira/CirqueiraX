<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\TokenAgente;
use App\Enum\TipoCliente;
use App\Repository\TokenAgenteRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:agente:gerar-token',
    description: 'Gera um token de serviço para um agente automatizado e o persiste no banco.',
)]
final class GerarTokenAgenteCommand extends Command
{
    public function __construct(
        private readonly TokenAgenteRepository $tokenAgenteRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('nome', InputArgument::OPTIONAL, 'Nome descritivo do agente (ex: "Agente Print Empresa")')
            ->addArgument('origem', InputArgument::OPTIONAL, 'Identificador da origem (ex: "print_empresa", "bot_telegram")')
            ->addOption('tipo', 't', InputOption::VALUE_REQUIRED, 'Tipo do cliente ("agente" ou "usuario")', 'agente');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Gerador de Token de Agente');

        /** @var string|null $nome */
        $nome = $input->getArgument('nome');
        if (empty($nome)) {
            $nome = $io->ask('Informe o nome descritivo do agente (ex: Agente Print Empresa)');
            if (empty($nome)) {
                $io->error('O nome do agente é obrigatório.');

                return Command::FAILURE;
            }
        }

        /** @var string|null $origem */
        $origem = $input->getArgument('origem');
        if (empty($origem)) {
            $origem = $io->ask('Informe a origem do agente (ex: print_empresa, bot_telegram)');
            if (empty($origem)) {
                $io->error('A origem do agente é obrigatória.');

                return Command::FAILURE;
            }
        }

        /** @var string $tipoInput */
        $tipoInput = $input->getOption('tipo');
        $tipoCliente = TipoCliente::tryFrom($tipoInput);
        if (null === $tipoCliente) {
            $io->error(sprintf('Tipo de cliente inválido: "%s". Tipos válidos: "agente", "usuario".', $tipoInput));

            return Command::FAILURE;
        }

        try {
            $tokenBruto = 'cx_ag_'.bin2hex(random_bytes(24));
            $hash = hash('sha256', $tokenBruto);

            $tokenAgente = new TokenAgente(
                nome: $nome,
                tokenHash: $hash,
                origem: $origem,
                tipoCliente: $tipoCliente,
            );

            $this->tokenAgenteRepository->salvar($tokenAgente);

            $io->success('Token de agente gerado e persistido com sucesso!');
            $io->definitionList(
                ['UUID' => $tokenAgente->uuid()?->toString() ?? 'N/A'],
                ['Nome' => $tokenAgente->nome()],
                ['Origem' => $tokenAgente->origem()],
                ['Tipo' => $tokenAgente->tipoCliente()->value],
                ['Criado Em' => $tokenAgente->criadoEm()->format('Y-m-d H:i:s')],
            );

            $io->section('Chave de Acesso (X-Agent-Token)');
            $io->writeln($tokenBruto);
            $io->newLine();
            $io->caution('ATENÇÃO: Copie e guarde esta chave agora em local seguro. Ela NÃO poderá ser exibida novamente!');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $io->error('Erro ao gerar token de agente: '.$e->getMessage());

            return Command::FAILURE;
        }
    }
}
