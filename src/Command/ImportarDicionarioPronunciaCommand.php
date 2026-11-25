<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\Pronuncia\ImportarDicionarioPronunciaService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:pronuncia:importar-dicionario',
    description: 'Carrega o dicionário de pronúncia CMU (config/pronuncia/cmudict.dict) no banco. Pode rodar de novo sem duplicar.',
)]
final class ImportarDicionarioPronunciaCommand extends Command
{
    private const int INTERVALO_PROGRESSO = 20000;

    public function __construct(
        private readonly ImportarDicionarioPronunciaService $importarDicionario,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Importando o dicionário de pronúncia');

        $proximoAviso = self::INTERVALO_PROGRESSO;
        $total = $this->importarDicionario->executar(static function (int $importadas) use ($io, &$proximoAviso): void {
            if ($importadas >= $proximoAviso) {
                $io->writeln(sprintf('  %d entradas...', $importadas));
                $proximoAviso += self::INTERVALO_PROGRESSO;
            }
        });

        $io->success(sprintf('%d pronúncias importadas.', $total));

        return Command::SUCCESS;
    }
}
