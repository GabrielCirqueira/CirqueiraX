<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\ItemRankingArtistaDTO;
use App\DataObject\Spotify\ItemRankingMusicaDTO;
use App\DataObject\Spotify\PeriodoMesSpotifyDTO;
use App\DataObject\Spotify\ResumoIntervaloComImagensDTO;
use App\DataObject\Spotify\ResumoIntervaloSpotifyDTO;
use App\Entity\Usuario;
use App\Repository\ReproducaoSpotifyRepository;
use DateTimeImmutable;
use DateTimeZone;

final readonly class ObterResumoIntervaloPersonalizadoService
{
    public function __construct(
        private ReproducaoSpotifyRepository $reproducaoRepository,
        private EnriquecerImagensSpotifyService $enriquecerImagensService,
    ) {}

    public function executar(
        Usuario $usuario,
        string $tipo = 'dias',
        ?int $dias = 7,
        ?int $ano = null,
        ?int $mes = null,
        ?string $inicio = null,
        ?string $fim = null,
        int $limite = 50,
    ): ResumoIntervaloComImagensDTO {
        $fusoLocal = new DateTimeZone(PeriodoMesSpotifyDTO::FUSO_HORARIO_PADRAO);
        $fusoUtc = new DateTimeZone('UTC');
        $agoraLocal = new DateTimeImmutable('now', $fusoLocal);

        $limiteSanitizado = max(5, min(100, $limite));

        [$inicioLocal, $fimLocal, $compInicioLocal, $compFimLocal, $rotuloPeriodo] = match ($tipo) {
            'mes' => $this->resolverIntervaloMes($agoraLocal, $fusoLocal, $ano, $mes),
            'ano' => $this->resolverIntervaloAno($agoraLocal, $fusoLocal, $ano),
            'personalizado' => $this->resolverIntervaloPersonalizado($agoraLocal, $fusoLocal, $inicio, $fim),
            default => $this->resolverIntervaloDias($agoraLocal, $fusoLocal, $dias ?? 7),
        };

        $inicioUtc = $inicioLocal->setTimezone($fusoUtc);
        $fimUtc = $fimLocal->setTimezone($fusoUtc);
        $compInicioUtc = $compInicioLocal->setTimezone($fusoUtc);
        $compFimUtc = $compFimLocal->setTimezone($fusoUtc);

        $totais = $this->reproducaoRepository->calcularTotaisIntervalo($usuario, $inicioUtc, $fimUtc);
        $totaisAnterior = $this->reproducaoRepository->calcularTotaisIntervalo($usuario, $compInicioUtc, $compFimUtc);

        $variacao = null;
        if ($totaisAnterior['totalMinutos'] > 0) {
            $diferenca = $totais['totalMinutos'] - $totaisAnterior['totalMinutos'];
            $variacao = (int) round(($diferenca / $totaisAnterior['totalMinutos']) * 100);
        }

        $topMusicas = $this->reproducaoRepository->obterRankingMusicasIntervalo(
            usuario: $usuario,
            inicioUtc: $inicioUtc,
            fimUtc: $fimUtc,
            limite: $limiteSanitizado,
        );

        $topArtistas = $this->reproducaoRepository->obterRankingArtistasIntervalo(
            usuario: $usuario,
            inicioUtc: $inicioUtc,
            fimUtc: $fimUtc,
            limite: $limiteSanitizado,
        );

        $resumoIntervalo = new ResumoIntervaloSpotifyDTO(
            totalMinutos: $totais['totalMinutos'],
            totalStreams: $totais['totalStreams'],
            variacaoMinutosPercentual: $variacao,
            topMusicas: $topMusicas,
            topArtistas: $topArtistas,
        );

        $faixas = [];
        foreach ($topMusicas as $m) {
            $faixas[] = [
                'codigo' => $m->codigoFaixa(),
                'nome' => $m->nomeFaixa(),
                'artista' => $m->artistaPrincipal(),
            ];
        }

        $artistas = [];
        foreach ($topArtistas as $a) {
            $artistas[] = [
                'codigo' => $a->codigoArtista(),
                'nome' => $a->nomeArtista(),
            ];
        }

        $mapaImagens = $this->enriquecerImagensService->enriquecerEAgendar(
            usuario: $usuario,
            faixas: $faixas,
            artistas: $artistas,
            prioridade: 1,
        );

        return new ResumoIntervaloComImagensDTO(
            intervalo: $resumoIntervalo,
            rotuloPeriodo: $rotuloPeriodo,
            dataInicio: $inicioLocal->format('Y-m-d H:i:s'),
            dataFim: $fimLocal->format('Y-m-d H:i:s'),
            mapaImagens: $mapaImagens,
        );
    }

    /**
     * @return array{0: DateTimeImmutable, 1: DateTimeImmutable, 2: DateTimeImmutable, 3: DateTimeImmutable, 4: string}
     */
    private function resolverIntervaloDias(
        DateTimeImmutable $agoraLocal,
        DateTimeZone $fusoLocal,
        int $dias,
    ): array {
        if ($dias <= 1) {
            $hojeInicioLocal = new DateTimeImmutable('today 00:00:00', $fusoLocal);
            $hojeFimLocal = $hojeInicioLocal->modify('+1 day');
            $ontemInicioLocal = $hojeInicioLocal->modify('-1 day');

            return [
                $hojeInicioLocal,
                $hojeFimLocal,
                $ontemInicioLocal,
                $hojeInicioLocal,
                'Hoje',
            ];
        }

        $diasSanitizados = max(1, min(365, $dias));
        $fimLocal = $agoraLocal;
        $inicioLocal = $agoraLocal->modify(sprintf('-%d days', $diasSanitizados));
        $compInicioLocal = $inicioLocal->modify(sprintf('-%d days', $diasSanitizados));

        return [
            $inicioLocal,
            $fimLocal,
            $compInicioLocal,
            $inicioLocal,
            sprintf('Últimos %d dias', $diasSanitizados),
        ];
    }

    /**
     * @return array{0: DateTimeImmutable, 1: DateTimeImmutable, 2: DateTimeImmutable, 3: DateTimeImmutable, 4: string}
     */
    private function resolverIntervaloMes(
        DateTimeImmutable $agoraLocal,
        DateTimeZone $fusoLocal,
        ?int $ano,
        ?int $mes,
    ): array {
        $anoFinal = $ano ?? (int) $agoraLocal->format('Y');
        $mesFinal = max(1, min(12, $mes ?? (int) $agoraLocal->format('m')));

        $inicioLocal = new DateTimeImmutable(sprintf('%04d-%02d-01 00:00:00', $anoFinal, $mesFinal), $fusoLocal);
        $fimLocal = $inicioLocal->modify('+1 month');
        $compInicioLocal = $inicioLocal->modify('-1 month');

        $nomesMeses = [
            1 => 'Janeiro',
            2 => 'Fevereiro',
            3 => 'Março',
            4 => 'Abril',
            5 => 'Maio',
            6 => 'Junho',
            7 => 'Julho',
            8 => 'Agosto',
            9 => 'Setembro',
            10 => 'Outubro',
            11 => 'Novembro',
            12 => 'Dezembro',
        ];

        return [
            $inicioLocal,
            $fimLocal,
            $compInicioLocal,
            $inicioLocal,
            sprintf('%s de %d', $nomesMeses[$mesFinal], $anoFinal),
        ];
    }

    /**
     * @return array{0: DateTimeImmutable, 1: DateTimeImmutable, 2: DateTimeImmutable, 3: DateTimeImmutable, 4: string}
     */
    private function resolverIntervaloAno(
        DateTimeImmutable $agoraLocal,
        DateTimeZone $fusoLocal,
        ?int $ano,
    ): array {
        $anoFinal = $ano ?? (int) $agoraLocal->format('Y');

        $inicioLocal = new DateTimeImmutable(sprintf('%04d-01-01 00:00:00', $anoFinal), $fusoLocal);
        $fimLocal = new DateTimeImmutable(sprintf('%04d-01-01 00:00:00', $anoFinal + 1), $fusoLocal);
        $compInicioLocal = new DateTimeImmutable(sprintf('%04d-01-01 00:00:00', $anoFinal - 1), $fusoLocal);

        return [
            $inicioLocal,
            $fimLocal,
            $compInicioLocal,
            $inicioLocal,
            sprintf('Ano de %d', $anoFinal),
        ];
    }

    /**
     * @return array{0: DateTimeImmutable, 1: DateTimeImmutable, 2: DateTimeImmutable, 3: DateTimeImmutable, 4: string}
     */
    private function resolverIntervaloPersonalizado(
        DateTimeImmutable $agoraLocal,
        DateTimeZone $fusoLocal,
        ?string $inicio,
        ?string $fim,
    ): array {
        try {
            $inicioLocal = $inicio !== null && '' !== trim($inicio)
                ? new DateTimeImmutable(trim($inicio) . ' 00:00:00', $fusoLocal)
                : $agoraLocal->modify('-30 days');

            $fimLocal = $fim !== null && '' !== trim($fim)
                ? (new DateTimeImmutable(trim($fim) . ' 23:59:59', $fusoLocal))->modify('+1 second')
                : $agoraLocal;
        } catch (\Throwable) {
            $inicioLocal = $agoraLocal->modify('-30 days');
            $fimLocal = $agoraLocal;
        }

        if ($inicioLocal > $fimLocal) {
            $temp = $inicioLocal;
            $inicioLocal = $fimLocal->modify('-1 day');
            $fimLocal = $temp;
        }

        $intervaloSegundos = max(86400, $fimLocal->getTimestamp() - $inicioLocal->getTimestamp());
        $compFimLocal = $inicioLocal;
        $compInicioLocal = $inicioLocal->modify(sprintf('-%d seconds', $intervaloSegundos));

        $rotulo = sprintf(
            '%s até %s',
            $inicioLocal->format('d/m/Y'),
            $fimLocal->modify('-1 second')->format('d/m/Y'),
        );

        return [
            $inicioLocal,
            $fimLocal,
            $compInicioLocal,
            $compFimLocal,
            $rotulo,
        ];
    }
}
