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

final readonly class ObterExtrasPaginaMusicaService
{
    public function __construct(
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private CacheAnaliseSpotifyService $cacheAnalise,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function rotina(Usuario $usuario, FiltroFonteMusica $fonte, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        return $this->cacheAnalise->lembrar(
            $usuario,
            'rotina|'.$periodo->chaveCache(),
            function () use ($usuario, $fonte, $periodo): array {
                $celulas = $this->analiseRepository->calcularMapaHorarios($usuario, $periodo, $fonte);
                $porHora = array_fill(0, 24, 0);
                $semana = 0;
                $fimDeSemana = 0;
                $madrugada = 0;
                $manha = 0;
                $tarde = 0;
                $noite = 0;

                foreach ($celulas as $celula) {
                    $hora = $celula['hora'];
                    $minutos = $celula['minutos'];
                    $porHora[$hora] += $minutos;
                    if ($celula['diaSemana'] === 0 || $celula['diaSemana'] === 6) {
                        $fimDeSemana += $minutos;
                    } else {
                        $semana += $minutos;
                    }
                    match (true) {
                        $hora >= 0 && $hora < 6 => $madrugada += $minutos,
                        $hora >= 6 && $hora < 12 => $manha += $minutos,
                        $hora >= 12 && $hora < 18 => $tarde += $minutos,
                        default => $noite += $minutos,
                    };
                }

                $horas = [];
                for ($h = 0; $h < 24; ++$h) {
                    $horas[] = ['hora' => $h, 'minutos' => $porHora[$h]];
                }

                return [
                    'porHora' => $horas,
                    'diaUtilMinutos' => $semana,
                    'fimDeSemanaMinutos' => $fimDeSemana,
                    'periodos' => [
                        'madrugada' => $madrugada,
                        'manha' => $manha,
                        'tarde' => $tarde,
                        'noite' => $noite,
                    ],
                    'mapa' => $celulas,
                ];
            },
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
            fn (): array => $this->analiseRepository->calcularSessoes($usuario, $periodo, $fonte),
            $fonte,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function nesteDia(Usuario $usuario, FiltroFonteMusica $fonte, ?int $mes = null, ?int $dia = null): array
    {
        $hoje = new DateTimeImmutable('now', new \DateTimeZone('America/Sao_Paulo'));
        $mes ??= (int) $hoje->format('n');
        $dia ??= (int) $hoje->format('j');

        return $this->cacheAnalise->lembrar(
            $usuario,
            sprintf('neste-dia|%02d-%02d', $mes, $dia),
            fn (): array => [
                'mes' => $mes,
                'dia' => $dia,
                'anos' => $this->analiseRepository->listarNesteDia($usuario, $fonte, $mes, $dia),
            ],
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
            fn (): array => [
                'diasSemOuvir' => $dias,
                'itens' => $this->analiseRepository->listarMusicasSaudade($usuario, $fonte, $dias),
            ],
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
            function () use ($usuario, $fonte, $periodo): array {
                $agregado = $this->analiseRepository->agregarVersoesAlteradas($usuario, $periodo, $fonte);
                $alteradas = array_values(array_filter(
                    $agregado,
                    static fn (array $item): bool => 'original' !== $item['tipo'] && '' !== $item['tipo'],
                ));
                $percentualAlteradas = array_sum(array_map(
                    static fn (array $item): float => $item['percentual'],
                    $alteradas,
                ));

                return [
                    'percentualAlteradas' => round($percentualAlteradas, 1),
                    'porTipo' => array_map(static function (array $item): array {
                        $tipo = TipoVersaoMusica::tryFrom($item['tipo']);

                        return [
                            ...$item,
                            'rotulo' => $tipo?->descricao() ?? $item['tipo'],
                        ];
                    }, $agregado),
                    'mashups' => $this->analiseRepository->listarRankingMashups($usuario, $periodo, $fonte),
                ];
            },
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
            fn (): array => [
                'itens' => $this->analiseRepository->listarProfundidadeArtistas($usuario, $periodo, $fonte),
            ],
            $fonte,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function historicoDia(Usuario $usuario, FiltroFonteMusica $fonte, string $data): array
    {
        return [
            'data' => $data,
            'itens' => $this->analiseRepository->listarReproducoesDoDia($usuario, $fonte, $data),
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
            fn (): array => $this->analiseRepository->listarExtremosDoDia($usuario, $periodo, $fonte),
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
            fn (): array => [
                'itens' => $this->analiseRepository->listarAlbunsEmSequencia($usuario, $periodo, $fonte),
            ],
            $fonte,
        );
    }
}
