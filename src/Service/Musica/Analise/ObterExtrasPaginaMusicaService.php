<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Enum\TipoVersaoMusica;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Service\Spotify\CacheAnaliseSpotifyService;
use DateTimeImmutable;
use DateTimeZone;

final readonly class ObterExtrasPaginaMusicaService
{
    private const int LIMITE_SAUDADE = 18;
    private const int LIMITE_PROFUNDIDADE = 12;
    private const int LIMITE_EXTREMOS = 5;
    private const int LIMITE_MASHUPS = 12;
    private const int LIMITE_TOP_VERSOES = 10;
    private const int CAPAS_POR_ANO_NESTE_DIA = 4;
    private const int LIMITE_ALBUNS_SEQUENCIA = 12;
    private const int LIMITE_ULTIMAS_PADRAO = 60;
    private const int LIMITE_ULTIMAS_MAXIMO = 200;
    private const string TIPO_ORIGINAL = 'original';
    private const string FUSO_LOCAL = 'America/Sao_Paulo';
    private const array FAIXAS_DO_DIA = ['madrugada' => [0, 6], 'manha' => [6, 12], 'tarde' => [12, 18], 'noite' => [18, 24]];

    public function __construct(
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private CacheAnaliseSpotifyService $cacheAnalise,
        private MontarItensComImagemMusicaService $montarItensService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function rotina(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        return $this->cacheAnalise->lembrar(
            $usuario,
            'rotina|'.$periodo->chaveCache(),
            fn (): array => $this->calcularRotina($usuario, $fonte, $periodo),
            $fonte,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function sessoes(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        return $this->cacheAnalise->lembrar(
            $usuario,
            'sessoes|'.$periodo->chaveCache(),
            function () use ($usuario, $fonte, $periodo): array {
                $sessoes = $this->analiseRepository->calcularSessoes($usuario, $periodo, $fonte);
                $itens = $this->montarItensService->montar($usuario, $fonte, $sessoes['maratonaMusicas']);

                return [
                    ...$sessoes,
                    'maratonaMusicas' => $this->ordenarPorUuids($sessoes['maratonaMusicas'], $itens['musicas']),
                ];
            },
            $fonte,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function nesteDia(Usuario $usuario, FiltroFonteMusica $fonte, ?int $mes = null, ?int $dia = null): array
    {
        $hoje = new DateTimeImmutable('now', new DateTimeZone(self::FUSO_LOCAL));
        $mes ??= (int) $hoje->format('n');
        $dia ??= (int) $hoje->format('j');

        return $this->cacheAnalise->lembrar(
            $usuario,
            sprintf('neste-dia|%02d-%02d', $mes, $dia),
            fn (): array => $this->calcularNesteDia($usuario, $fonte, $mes, $dia),
            $fonte,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function saudade(Usuario $usuario, FiltroFonteMusica $fonte, int $dias = 90): array
    {
        return $this->cacheAnalise->lembrar(
            $usuario,
            'saudade|'.$dias,
            function () use ($usuario, $fonte, $dias): array {
                $itens = $this->analiseRepository->listarMusicasSaudade($usuario, $fonte, $dias, self::LIMITE_SAUDADE);
                $musicas = $this->montarItensService->montar($usuario, $fonte, array_column($itens, 'musicaUuid'))['musicas'];

                return [
                    'diasSemOuvir' => $dias,
                    'itens' => $this->anexarMusica($itens, $musicas),
                ];
            },
            $fonte,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function versoesAlteradas(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        return $this->cacheAnalise->lembrar(
            $usuario,
            'versoes-alteradas|'.$periodo->chaveCache(),
            fn (): array => $this->calcularVersoes($usuario, $fonte, $periodo),
            $fonte,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function profundidade(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        return $this->cacheAnalise->lembrar(
            $usuario,
            'profundidade|'.$periodo->chaveCache(),
            function () use ($usuario, $fonte, $periodo): array {
                $itens = $this->analiseRepository->listarProfundidadeArtistas($usuario, $periodo, $fonte, self::LIMITE_PROFUNDIDADE);
                $artistas = $this->montarItensService->montar($usuario, $fonte, [], array_column($itens, 'artistaUuid'))['artistas'];

                return [
                    'mesesNoPeriodo' => $this->contarMesesComEscuta($usuario, $fonte, $periodo),
                    'itens' => array_map(static fn (array $item): array => [
                        ...$item,
                        'artista' => $artistas[$item['artistaUuid']] ?? null,
                    ], $itens),
                ];
            },
            $fonte,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function historicoDia(Usuario $usuario, FiltroFonteMusica $fonte, string $data): array
    {
        $itens = $this->analiseRepository->listarReproducoesDoDia($usuario, $fonte, $data);
        $musicas = $this->montarItensService->montar($usuario, $fonte, array_column($itens, 'musicaUuid'))['musicas'];

        return [
            'data' => $data,
            'itens' => $this->anexarMusica($itens, $musicas),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function ultimasOuvidas(Usuario $usuario, FiltroFonteMusica $fonte, ?int $limite, ?string $antesUtc): array
    {
        $limiteValido = max(1, min(self::LIMITE_ULTIMAS_MAXIMO, $limite ?? self::LIMITE_ULTIMAS_PADRAO));
        $itens = $this->analiseRepository->listarUltimasReproducoes($usuario, $fonte, $limiteValido, $antesUtc);
        $musicas = $this->montarItensService->montar($usuario, $fonte, array_column($itens, 'musicaUuid'))['musicas'];
        $ultimo = end($itens);

        return [
            'itens' => $this->anexarMusica($itens, $musicas),
            'proximoCursor' => count($itens) === $limiteValido && false !== $ultimo ? $ultimo['tocadaEmUtc'] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function extremosDoDia(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        return $this->cacheAnalise->lembrar(
            $usuario,
            'extremos-dia|'.$periodo->chaveCache(),
            function () use ($usuario, $fonte, $periodo): array {
                $extremos = $this->analiseRepository->listarExtremosDoDia($usuario, $periodo, $fonte, self::LIMITE_EXTREMOS);
                $uuids = [...array_column($extremos['aberturas'], 'musicaUuid'), ...array_column($extremos['fechamentos'], 'musicaUuid')];
                $musicas = $this->montarItensService->montar($usuario, $fonte, $uuids)['musicas'];

                return [
                    'aberturas' => $this->anexarMusica($extremos['aberturas'], $musicas),
                    'fechamentos' => $this->anexarMusica($extremos['fechamentos'], $musicas),
                ];
            },
            $fonte,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function albunsEmSequencia(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        return $this->cacheAnalise->lembrar(
            $usuario,
            'albuns-sequencia|'.$periodo->chaveCache(),
            function () use ($usuario, $fonte, $periodo): array {
                $itens = $this->analiseRepository->listarAlbunsEmSequencia($usuario, $periodo, $fonte, limite: self::LIMITE_ALBUNS_SEQUENCIA);
                $musicas = $this->montarItensService->montar($usuario, $fonte, array_filter(array_column($itens, 'musicaUuid')))['musicas'];

                return ['itens' => $this->anexarMusica($itens, $musicas)];
            },
            $fonte,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function calcularRotina(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        $celulas = $this->analiseRepository->calcularMapaHorarios($usuario, $periodo, $fonte);
        $porHora = array_fill(0, 24, 0);
        $porDiaSemana = array_fill(0, 7, 0);
        foreach ($celulas as $celula) {
            $porHora[$celula['hora']] += $celula['minutos'];
            $porDiaSemana[$celula['diaSemana']] += $celula['minutos'];
        }

        $topPorFaixa = $this->analiseRepository->listarTopArtistaPorFaixaDoDia($usuario, $periodo, $fonte);
        $artistas = $this->montarItensService->montar($usuario, $fonte, [], array_column($topPorFaixa, 'artistaUuid'))['artistas'];
        $topIndexado = array_column($topPorFaixa, null, 'faixa');

        $periodos = [];
        foreach (self::FAIXAS_DO_DIA as $faixa => [$inicio, $fim]) {
            $periodos[] = [
                'faixa' => $faixa,
                'inicio' => $inicio,
                'fim' => $fim,
                'minutos' => array_sum(array_slice($porHora, $inicio, $fim - $inicio)),
                'topArtista' => $artistas[$topIndexado[$faixa]['artistaUuid'] ?? ''] ?? null,
            ];
        }

        return [
            'porHora' => array_map(static fn (int $hora, int $minutos): array => ['hora' => $hora, 'minutos' => $minutos], array_keys($porHora), $porHora),
            'porDiaSemana' => array_map(static fn (int $dia, int $minutos): array => ['diaSemana' => $dia, 'minutos' => $minutos], array_keys($porDiaSemana), $porDiaSemana),
            'periodos' => $periodos,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function calcularNesteDia(Usuario $usuario, FiltroFonteMusica $fonte, int $mes, int $dia): array
    {
        $anos = $this->analiseRepository->listarTopMusicasNesteDia($usuario, $fonte, $mes, $dia, self::CAPAS_POR_ANO_NESTE_DIA);
        $musicas = $this->montarItensService->montar($usuario, $fonte, array_merge([], ...array_values($anos)))['musicas'];

        return [
            'mes' => $mes,
            'dia' => $dia,
            'anos' => array_map(fn (array $ano): array => [
                ...$ano,
                'musicas' => $this->ordenarPorUuids($anos[$ano['ano']] ?? [], $musicas),
            ], $this->analiseRepository->listarNesteDia($usuario, $fonte, $mes, $dia)),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function calcularVersoes(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        $agregado = $this->analiseRepository->agregarVersoesAlteradas($usuario, $periodo, $fonte);
        $alteradas = array_filter($agregado, static fn (array $item): bool => self::TIPO_ORIGINAL !== $item['tipo'] && '' !== $item['tipo']);
        $mashups = $this->analiseRepository->listarRankingMashups($usuario, $periodo, $fonte, self::LIMITE_MASHUPS);
        $topVersoes = $this->analiseRepository->listarTopVersoesAlteradas($usuario, $periodo, $fonte, self::LIMITE_TOP_VERSOES);
        $artistasPorMashup = $this->analiseRepository->listarArtistasDasMusicas(array_column($mashups, 'musicaUuid'));
        $itens = $this->montarItensService->montar(
            $usuario,
            $fonte,
            [...array_column($mashups, 'musicaUuid'), ...array_column($topVersoes, 'musicaUuid')],
            array_merge([], ...array_values($artistasPorMashup)),
        );

        return [
            'percentualAlteradas' => round(array_sum(array_column($alteradas, 'percentual')), 1),
            'porTipo' => array_map(static fn (array $item): array => [
                ...$item,
                'rotulo' => TipoVersaoMusica::tryFrom($item['tipo'])?->descricao() ?? $item['tipo'],
            ], $agregado),
            'topVersoes' => array_map(static fn (array $item): array => [
                ...$item,
                'rotulo' => TipoVersaoMusica::tryFrom($item['tipo'])?->descricao() ?? $item['tipo'],
                'musica' => $itens['musicas'][$item['musicaUuid']] ?? null,
            ], $topVersoes),
            'mashups' => array_map(fn (array $item): array => [
                ...$item,
                'musica' => $itens['musicas'][$item['musicaUuid']] ?? null,
                'artistasComponentes' => $this->ordenarPorUuids($artistasPorMashup[$item['musicaUuid']] ?? [], $itens['artistas']),
            ], $mashups),
        ];
    }

    private function contarMesesComEscuta(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): int
    {
        return count($this->analiseRepository->calcularEvolucaoMensal($usuario, $periodo, $fonte));
    }

    /**
     * @param list<array<string, mixed>> $itens
     * @param array<string, array<string, mixed>> $musicas
     *
     * @return list<array<string, mixed>>
     */
    private function anexarMusica(array $itens, array $musicas): array
    {
        return array_map(static fn (array $item): array => [
            ...$item,
            'musica' => $musicas[(string) ($item['musicaUuid'] ?? '')] ?? null,
        ], $itens);
    }

    /**
     * @param list<string> $uuids
     * @param array<string, array<string, mixed>> $mapa
     *
     * @return list<array<string, mixed>>
     */
    private function ordenarPorUuids(array $uuids, array $mapa): array
    {
        return array_values(array_filter(array_map(static fn (string $uuid): ?array => $mapa[$uuid] ?? null, $uuids)));
    }
}
