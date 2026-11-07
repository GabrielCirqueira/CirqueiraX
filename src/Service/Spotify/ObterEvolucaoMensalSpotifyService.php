<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\Analise\EvolucaoMensalSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\Usuario;
use App\Repository\AnaliseReproducaoSpotifyRepository;
use DateTimeImmutable;

final readonly class ObterEvolucaoMensalSpotifyService
{
    private const int MESES_PADRAO = 24;
    private const int MESES_MAXIMO = 120;

    public function __construct(
        private CacheAnaliseSpotifyService $cacheAnalise,
        private AnaliseReproducaoSpotifyRepository $analiseRepository,
    ) {}

    public function executar(Usuario $usuario, ?int $meses): EvolucaoMensalSpotifyDTO
    {
        return $this->cacheAnalise->lembrar($usuario, 'evolucao|' . ($meses ?? 0), fn (): EvolucaoMensalSpotifyDTO => $this->calcular($usuario, $meses));
    }

    private function calcular(Usuario $usuario, ?int $meses): EvolucaoMensalSpotifyDTO
    {
        $quantidade = max(1, min(self::MESES_MAXIMO, $meses ?? self::MESES_PADRAO));
        $agora = PeriodoAnaliseSpotifyDTO::agoraCalendario();
        $inicioMesAtual = $agora->modify('first day of this month')->setTime(0, 0);
        $inicioJanela = $inicioMesAtual->modify(sprintf('-%d months', $quantidade - 1));
        $amanha = $agora->setTime(0, 0)->modify('+1 day');
        $diaAtual = (int) $agora->format('j');

        $linhas = $this->analiseRepository->calcularEvolucaoMensal(
            $usuario,
            PeriodoAnaliseSpotifyDTO::entre($inicioJanela, $inicioMesAtual->modify('+1 month'), 'Evolução'),
        );

        return new EvolucaoMensalSpotifyDTO(
            meses: $this->preencherMeses($linhas, $inicioJanela, $quantidade),
            ano: (int) $agora->format('Y'),
            mes: (int) $agora->format('n'),
            diaAtual: $diaAtual,
            minutosMesAtual: $this->minutosEntre($usuario, $inicioMesAtual, $amanha),
            minutosMesAnteriorAteMesmoDia: $this->minutosAteMesmoDia($usuario, $inicioMesAtual->modify('-1 month'), $diaAtual),
            minutosMesmoMesAnoAnteriorAteMesmoDia: $this->minutosAteMesmoDia($usuario, $inicioMesAtual->modify('-1 year'), $diaAtual),
            minutosMesmoMesAnoAnterior: $this->minutosEntre(
                $usuario,
                $inicioMesAtual->modify('-1 year'),
                $inicioMesAtual->modify('-1 year')->modify('+1 month'),
            ),
        );
    }

    /**
     * @param list<array{ano: int, mes: int, streams: int, minutos: int}> $linhas
     *
     * @return list<array{ano: int, mes: int, streams: int, minutos: int}>
     */
    private function preencherMeses(array $linhas, DateTimeImmutable $inicio, int $quantidade): array
    {
        $indexadas = [];
        foreach ($linhas as $linha) {
            $indexadas[sprintf('%04d-%02d', $linha['ano'], $linha['mes'])] = $linha;
        }

        $meses = [];
        for ($indice = 0; $indice < $quantidade; ++$indice) {
            $mes = $inicio->modify(sprintf('+%d months', $indice));
            $chave = $mes->format('Y-m');
            $meses[] = $indexadas[$chave] ?? [
                'ano' => (int) $mes->format('Y'),
                'mes' => (int) $mes->format('n'),
                'streams' => 0,
                'minutos' => 0,
            ];
        }

        return $meses;
    }

    private function minutosAteMesmoDia(Usuario $usuario, DateTimeImmutable $inicioMes, int $dia): int
    {
        $diasNoMes = (int) $inicioMes->format('t');

        return $this->minutosEntre($usuario, $inicioMes, $inicioMes->modify(sprintf('+%d days', min($dia, $diasNoMes))));
    }

    private function minutosEntre(Usuario $usuario, DateTimeImmutable $inicio, DateTimeImmutable $fim): int
    {
        return $this->analiseRepository->calcularTotais($usuario, PeriodoAnaliseSpotifyDTO::entre($inicio, $fim, 'Comparação'))['minutos'];
    }
}
