<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\Importacao\ImportarVideosFrankyService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:media:importar-videos-franky',
    description: 'Importa histórico de vídeos baixados do backup do sistema Franky para o CirqueiraX com status arquivo_removido.'
)]
final class ImportarVideosFrankyCommand extends Command
{
    public function __construct(
        private readonly ImportarVideosFrankyService $importarVideosFrankyService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption(
                'arquivo',
                'f',
                InputOption::VALUE_OPTIONAL,
                'Caminho do arquivo SQL de backup do Franky.',
                'var/imports/franky-20261012-181923.sql'
            )
            ->addOption(
                'dry-run',
                null,
                InputOption::VALUE_NONE,
                'Executa em modo de simulação sem salvar nada no banco de dados.'
            );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $arquivo = (string) $input->getOption('arquivo');
        $dryRun = (bool) $input->getOption('dry-run');

        $io->title('Importação de Vídeos Baixados do Franky -> CirqueiraX');
        if ($dryRun) {
            $io->warning('Modo DRY-RUN ativado: nenhuma alteração será persistida no banco de dados.');
        }

        $io->info(sprintf('Processando backup SQL: %s', $arquivo));

        try {
            $resultado = $this->importarVideosFrankyService->importar($arquivo, $dryRun);

            $io->table(
                ['Métrica', 'Valor'],
                [
                    ['Total de Linhas no Dump', (string) $resultado['totalEncontradosDump']],
                    ['Falhas no Franky Ignoradas (status erro)', (string) $resultado['totalErrosIgnorados']],
                    ['URLs Duplicadas no Dump Ignoradas', (string) $resultado['totalDuplicadosDump']],
                    ['Já Existentes no CirqueiraX', (string) $resultado['totalJaExistentesCirqueira']],
                    ['Vídeos Importados (Status: arquivo_removido)', (string) $resultado['totalImportados']],
                    ['Espaço Histórico Registrado', $resultado['espacoTotalFormatado'] . ' (' . number_format($resultado['espacoTotalBytes'], 0, ',', '.') . ' bytes)'],
                    ['Modo de Execução', $dryRun ? 'Simulação (Dry-run)' : 'Produção (Gravado no banco)'],
                ]
            );

            if (!empty($resultado['erros'])) {
                $io->section('Ocorrências');
                foreach (array_slice($resultado['erros'], 0, 10) as $err) {
                    $io->warning($err);
                }
                if (count($resultado['erros']) > 10) {
                    $io->note(sprintf('... e mais %d erros.', count($resultado['erros']) - 10));
                }
            }

            if ($dryRun) {
                $io->success(sprintf('Simulação concluída! %d vídeos estariam prontos para importação.', $resultado['totalImportados']));
            } else {
                $io->success(sprintf('Sucesso! %d vídeos foram importados para o CirqueiraX com status "arquivo_removido".', $resultado['totalImportados']));
            }

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $io->error(sprintf('Falha na importação: %s', $e->getMessage()));

            return Command::FAILURE;
        }
    }
}
