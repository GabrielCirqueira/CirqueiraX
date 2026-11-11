<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\AlbumAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\PeriodoMesSpotifyDTO;
use App\DataObject\Spotify\ResumoIntervaloComImagensDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Service\Spotify\EnriquecerImagensSpotifyService;
use App\Repository\AnaliseReproducaoMusicalRepository;
use DateTimeImmutable;
use DateTimeZone;

final readonly class ObterResumoIntervaloPersonalizadoService
{
    private const string TIPO_TODOS = 'todos';
    private const int LIMITE_MINIMO = 5;
    private const int LIMITE_MAXIMO = 100;

    public function __construct(
        private EnriquecerImagensSpotifyService $enriquecerImagensService,
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private MontarResumoIntervaloMusicaService $montarResumoService,
    ) {}

    public function executar(
        Usuario $usuario,
        FiltroFonteMusica $fonte,
        string $tipo = 'dias',
        ?int $dias = 7,
        ?int $ano = null,
        ?int $mes = null,
        ?string $inicio = null,
        ?string $fim = null,
        int $limite = 50,
    ): ResumoIntervaloComImagensDTO {
        $limiteSanitizado = max(self::LIMITE_MINIMO, min(self::LIMITE_MAXIMO, $limite));

        [$inicioLocal, $fimLocal, $compInicioLocal, $compFimLocal, $rotuloPeriodo] = $this->resolverIntervalo($tipo, $dias, $ano, $mes, $inicio, $fim);

        $periodo = self::TIPO_TODOS === $tipo ? PeriodoAnaliseSpotifyDTO::todos() : PeriodoAnaliseSpotifyDTO::entre($inicioLocal, $fimLocal, $rotuloPeriodo);
        $comparacao = self::TIPO_TODOS === $tipo ? null : PeriodoAnaliseSpotifyDTO::entre($compInicioLocal, $compFimLocal, $rotuloPeriodo);
        $resumoIntervalo = $this->montarResumoService->montar($usuario, $fonte, $periodo, $comparacao, $limiteSanitizado);
        $topAlbuns = $this->analiseRepository->listarRankingAlbuns($usuario, $periodo, $fonte, $limiteSanitizado);

        $faixas = $this->montarResumoService->listarFaixasParaImagens($resumoIntervalo);
        foreach ($topAlbuns as $album) {
            if ($album->temSpotify()) {
                $faixas[] = $album->paraEnriquecimento();
            }
        }
        $artistas = $this->montarResumoService->listarArtistasParaImagens($resumoIntervalo);

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
            topAlbuns: array_map(static fn (AlbumAnaliseSpotifyDTO $album): AlbumAnaliseSpotifyDTO => $album->comImagem($mapaImagens), $topAlbuns),
        );
    }

    /**
     * @return array{0: DateTimeImmutable, 1: DateTimeImmutable, 2: DateTimeImmutable, 3: DateTimeImmutable, 4: string}
     */
    public function resolverIntervalo(
        string $tipo,
        ?int $dias,
        ?int $ano,
        ?int $mes,
        ?string $inicio,
        ?string $fim,
    ): array {
        $fusoLocal = new DateTimeZone(PeriodoMesSpotifyDTO::FUSO_HORARIO_PADRAO);
        $agoraLocal = new DateTimeImmutable('now', $fusoLocal);
        $fusoCalendario = new DateTimeZone(PeriodoMesSpotifyDTO::FUSO_CALENDARIO_SPOTIFY);
        $agoraCalendario = new DateTimeImmutable('now', $fusoCalendario);

        return match ($tipo) {
            'mes' => $this->resolverIntervaloMes($agoraCalendario, $fusoCalendario, $ano, $mes),
            'ano' => $this->resolverIntervaloAno($agoraCalendario, $fusoCalendario, $ano),
            'personalizado' => $this->resolverIntervaloPersonalizado($agoraLocal, $fusoLocal, $inicio, $fim),
            'todos' => $this->resolverIntervaloTodos($agoraLocal, $fusoLocal),
            default => $this->resolverIntervaloDias($agoraLocal, $fusoLocal, $dias ?? 7),
        };
    }

    /**
     * @return array{0: DateTimeImmutable, 1: DateTimeImmutable, 2: DateTimeImmutable, 3: DateTimeImmutable, 4: string}
     */
    private function resolverIntervaloTodos(DateTimeImmutable $agoraLocal, DateTimeZone $fusoLocal): array
    {
        $inicioLocal = new DateTimeImmutable('2000-01-01 00:00:00', $fusoLocal);
        $fimLocal = $agoraLocal->setTime(0, 0)->modify('+1 day');

        return [$inicioLocal, $fimLocal, $inicioLocal, $inicioLocal, 'Desde sempre'];
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
