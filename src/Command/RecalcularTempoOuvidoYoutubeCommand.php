<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Usuario;
use App\Repository\ReproducaoYoutubeRepository;
use App\Repository\UsuarioRepository;
use App\Service\Musica\Projecao\ProjetarReproducoesYoutubeService;
use App\Service\YoutubeMusic\CalcularFatorFimDeSessaoYoutubeService;
use App\Service\YoutubeMusic\RecalcularTempoOuvidoYoutubeService;
use DateTimeImmutable;
use DateTimeZone;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:youtube:recalcular-tempo-ouvido',
    description: 'Recalcula os minutos estimados das reproduções do YouTube com a regra atual (fim de sessão calibrado e interrupção pelo Spotify).',
)]
final class RecalcularTempoOuvidoYoutubeCommand extends Command
{
    private const string FORMATO_INICIO_MES = 'Y-m-01 00:00:00';
    private const string PROXIMO_MES = '+1 month';
    private const string EM_ANDAMENTO_HA = '-2 hours';
    private const string FUSO_BANCO = 'UTC';

    public function __construct(
        private readonly UsuarioRepository $usuarioRepository,
        private readonly ReproducaoYoutubeRepository $reproducaoRepository,
        private readonly RecalcularTempoOuvidoYoutubeService $recalcularTempo,
        private readonly CalcularFatorFimDeSessaoYoutubeService $calcularFator,
        private readonly ProjetarReproducoesYoutubeService $projetarYoutube,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('usuario', null, InputOption::VALUE_REQUIRED, 'Id do usuário (sem a opção, recalcula todos)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $idUsuario = $input->getOption('usuario');
        $usuarios = null === $idUsuario
            ? $this->usuarioRepository->findAll()
            : array_filter([$this->usuarioRepository->find((int) $idUsuario)]);

        $ids = array_map(static fn (Usuario $usuario): ?int => $usuario->getId(), $usuarios);
        foreach (array_filter($ids) as $id) {
            $this->recalcularUsuario($io, $id);
        }

        return Command::SUCCESS;
    }

    private function recalcularUsuario(SymfonyStyle $io, int $id): void
    {
        $usuario = $this->usuarioRepository->find($id);
        if (null === $usuario) {
            return;
        }

        $limites = $this->reproducaoRepository->obterLimitesDoUsuario($usuario);
        if (null === $limites['primeira'] || null === $limites['ultima']) {
            return;
        }

        $fator = $this->calcularFator->executar($usuario);
        $ignorarAPartirDe = new DateTimeImmutable(self::EM_ANDAMENTO_HA, new DateTimeZone(self::FUSO_BANCO));
        $ultima = new DateTimeImmutable($limites['ultima']);
        $inicio = new DateTimeImmutable((new DateTimeImmutable($limites['primeira']))->format(self::FORMATO_INICIO_MES));
        $total = 0;

        while ($inicio <= $ultima) {
            $fim = $inicio->modify(self::PROXIMO_MES);
            $usuario = $this->usuarioRepository->find($id) ?? $usuario;
            $total += $this->recalcularTempo->calcularIntervalo($usuario, $inicio, $fim, $fator, false, $ignorarAPartirDe);
            $this->reproducaoRepository->flush();
            $this->reproducaoRepository->limparCache();
            $inicio = $fim;
        }

        $usuario = $this->usuarioRepository->find($id) ?? $usuario;
        $this->projetarYoutube->projetarTudo($usuario);
        $io->writeln(sprintf('Usuário %d: %d reproduções recalculadas (fator de fim de sessão %.2f).', $id, $total, $fator));
    }
}
