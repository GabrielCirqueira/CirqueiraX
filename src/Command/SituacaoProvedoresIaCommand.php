<?php

declare(strict_types=1);

namespace App\Command;

use App\DataObject\Ia\SituacaoProvedorIaDTO;
use App\Enum\ProvedorIa;
use App\Service\Ia\AtualizarEstadoProvedorIaService;
use App\Service\Ia\ListarSituacaoProvedoresIaService;
use DateTimeImmutable;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:ia:provedores',
    description: 'Mostra a situação de cada provedor do pool de IA (ordem de uso, bloqueios e totais) e permite desbloquear um provedor.',
)]
final class SituacaoProvedoresIaCommand extends Command
{
    private const string OPCAO_DESBLOQUEAR = 'desbloquear';
    private const string FORMATO_DATA = 'd/m H:i';
    private const string SIM = 'sim';
    private const string NAO = 'não';
    private const string VAZIO = '—';

    public function __construct(
        private readonly ListarSituacaoProvedoresIaService $listarSituacao,
        private readonly AtualizarEstadoProvedorIaService $estadoProvedores,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption(self::OPCAO_DESBLOQUEAR, null, InputOption::VALUE_REQUIRED, sprintf('Provedor a desbloquear (%s)', implode(', ', array_column(ProvedorIa::cases(), 'value'))));
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $desbloquear = $input->getOption(self::OPCAO_DESBLOQUEAR);

        if (is_string($desbloquear)) {
            return $this->desbloquear($io, $desbloquear);
        }

        $agora = new DateTimeImmutable();
        $situacoes = $this->listarSituacao->executar();
        $io->table(
            ['Ordem', 'Provedor', 'Modelo', 'Chave', 'Gratuito', 'Em uso', 'Bloqueado até', 'Sucessos', 'Falhas', 'Motivo'],
            array_map(fn (SituacaoProvedorIaDTO $situacao, int $indice): array => $this->montarLinha($situacao, $indice + 1, $agora), $situacoes, array_keys($situacoes)),
        );

        return Command::SUCCESS;
    }

    private function desbloquear(SymfonyStyle $io, string $valor): int
    {
        $provedor = ProvedorIa::tryFrom($valor);
        if (null === $provedor) {
            $io->error(sprintf('Provedor desconhecido: %s.', $valor));

            return Command::INVALID;
        }

        $this->estadoProvedores->desbloquear($provedor);
        $io->success(sprintf('%s desbloqueado.', $provedor->nome()));

        return Command::SUCCESS;
    }

    /**
     * @return list<string|int>
     */
    private function montarLinha(SituacaoProvedorIaDTO $situacao, int $ordem, DateTimeImmutable $agora): array
    {
        $bloqueado = $situacao->isBloqueado($agora);

        return [
            $ordem,
            $situacao->provedor->nome(),
            $situacao->modelo,
            $situacao->configurado ? self::SIM : self::NAO,
            $situacao->gratuito ? self::SIM : self::NAO,
            $situacao->permitido ? self::SIM : self::NAO,
            $bloqueado ? $situacao->bloqueadoAte?->format(self::FORMATO_DATA) ?? self::VAZIO : self::VAZIO,
            $situacao->totalSucessos,
            $situacao->totalFalhas,
            $bloqueado ? (string) $situacao->motivoBloqueio : self::VAZIO,
        ];
    }
}
