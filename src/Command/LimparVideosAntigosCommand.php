<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\MediaItem\LimparVideosAntigosService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:media:limpar-videos-antigos',
    description: 'Expurga arquivos locais de vídeos antigos (> 7 dias) para liberar espaço no disco da VPS, preservando metadados e permitindo rebaixar.'
)]
final class LimparVideosAntigosCommand extends Command
{
    public function __construct(
        private readonly LimparVideosAntigosService $limparVideosAntigosService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption(
                'dias',
                'd',
                InputOption::VALUE_REQUIRED,
                'Número de dias de antiguidade para expurgar os arquivos de vídeo.',
                '7'
            )
            ->addOption(
                'dry-run',
                null,
                InputOption::VALUE_NONE,
                'Executa a varredura em modo de simulação sem apagar arquivos físicos.'
            );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dias = max(1, (int) $input->getOption('dias'));
        $dryRun = (bool) $input->getOption('dry-run');

        $io->title('Limpeza de Vídeos Antigos (Liberação de Espaço)');
        if ($dryRun) {
            $io->warning('Modo DRY-RUN ativado: nenhum arquivo físico será excluído.');
        }

        $io->info(sprintf('Buscando vídeos com mais de %d dias concluídos/distribuídos...', $dias));

        $resultado = $this->limparVideosAntigosService->executar($dias, $dryRun);

        $io->table(
            ['Métrica', 'Valor'],
            [
                ['Vídeos Analisados', (string) $resultado['totalAnalisados']],
                ['Vídeos Expurgados', (string) $resultado['totalExpurgados']],
                ['Espaço Liberado', $resultado['espacoLiberadoFormatado'] . ' (' . number_format($resultado['espacoLiberadoBytes'], 0, ',', '.') . ' bytes)'],
                ['Modo', $dryRun ? 'Simulação (Dry-run)' : 'Produção (Arquivos removidos)'],
            ]
        );

        if (!empty($resultado['erros'])) {
            $io->section('Ocorrências e Erros');
            foreach ($resultado['erros'] as $erro) {
                $io->error($erro);
            }
        }

        $io->success(sprintf('Operação concluída. %d vídeos processados.', $resultado['totalExpurgados']));

        return Command::SUCCESS;
    }
}
