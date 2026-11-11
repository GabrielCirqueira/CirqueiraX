<?php

declare(strict_types=1);

namespace App\Command;

use App\Enum\ResultadoEtapaImportacaoYoutube;
use App\Exception\ImportacaoYoutube\ImportacaoYoutubeException;
use App\Repository\ImportacaoYoutubeRepository;
use App\Service\YoutubeMusic\Importacao\ProcessarImportacaoYoutubeService;
use App\Service\YoutubeMusic\Importacao\RetomarImportacaoYoutubeService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:youtube:continuar-importacao',
    description: 'Continua uma importação do Takeout de onde parou (inclusive depois de erro).',
)]
final class ContinuarImportacaoYoutubeCommand extends Command
{
    public function __construct(
        private readonly RetomarImportacaoYoutubeService $retomarService,
        private readonly ProcessarImportacaoYoutubeService $processarService,
        private readonly ImportacaoYoutubeRepository $importacaoRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('uuid', InputArgument::REQUIRED, 'Uuid da importação');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $uuid = (string) $input->getArgument('uuid');

        try {
            $this->retomarService->executar($uuid);
        } catch (ImportacaoYoutubeException $erro) {
            $io->error($erro->getMessage());

            return Command::FAILURE;
        }

        do {
            $resultado = $this->processarService->executar($uuid);
            $importacao = $this->importacaoRepository->buscarPorUuid($uuid);
            $io->writeln(sprintf('%s — %s', $importacao?->status()->descricao() ?? '', $importacao?->etapa()->descricao() ?? ''));
        } while (ResultadoEtapaImportacaoYoutube::Continuar === $resultado);

        if (ResultadoEtapaImportacaoYoutube::Aguardar === $resultado) {
            $io->warning('A etapa atual precisa esperar (cota da YouTube Data API ou falha da IA). Rode de novo mais tarde.');
        }

        return Command::SUCCESS;
    }
}
