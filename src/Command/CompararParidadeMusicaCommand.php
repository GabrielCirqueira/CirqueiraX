<?php

declare(strict_types=1);

namespace App\Command;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Repository\UsuarioRepository;
use App\Service\Musica\Projecao\CompararParidadeSpotifyService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:musica:comparar-paridade',
    description: 'Compara as consultas antigas do Spotify com as da projeção unificada (fonte spotify) e imprime as diferenças.',
)]
final class CompararParidadeMusicaCommand extends Command
{
    private const int ANO_CALIBRACAO = 2026;
    private const array MESES_CALIBRACAO = [4, 5, 6];
    private const int DIAS_RECENTES = 30;

    public function __construct(
        private readonly CompararParidadeSpotifyService $compararParidade,
        private readonly UsuarioRepository $usuarioRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('usuario', 'u', InputOption::VALUE_REQUIRED, 'Id do usuário');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $usuario = $this->usuarioRepository->find((int) $input->getOption('usuario'));
        if (null === $usuario) {
            $io->error('Informe um usuário válido com --usuario.');

            return Command::INVALID;
        }

        $periodos = [
            ...array_map(static fn (int $mes): PeriodoAnaliseSpotifyDTO => PeriodoAnaliseSpotifyDTO::doMes(self::ANO_CALIBRACAO, $mes), self::MESES_CALIBRACAO),
            PeriodoAnaliseSpotifyDTO::doAno(self::ANO_CALIBRACAO),
            PeriodoAnaliseSpotifyDTO::doAno(self::ANO_CALIBRACAO - 1),
            PeriodoAnaliseSpotifyDTO::ultimosDias(self::DIAS_RECENTES),
            PeriodoAnaliseSpotifyDTO::todos(),
        ];
        $diferencas = $this->compararParidade->executar($usuario, $periodos);

        if ([] === $diferencas) {
            $io->success('Paridade completa: nenhuma diferença.');

            return Command::SUCCESS;
        }

        $io->table(['Período', 'Métrica', 'Consulta antiga', 'Projeção'], array_map(static fn (array $diferenca): array => array_values($diferenca), $diferencas));
        $io->warning(sprintf('%d diferenças.', count($diferencas)));

        return Command::FAILURE;
    }
}
