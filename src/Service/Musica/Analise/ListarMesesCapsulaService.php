<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\PeriodoMesSpotifyDTO;
use App\DataObject\Spotify\ResumoMesCapsulaDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class ListarMesesCapsulaService
{
    private const int LIMITE_DESTAQUE = 1;

    public function __construct(
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private CacheAnaliseSpotifyService $cacheAnalise,
    ) {}

    /**
     * @return list<ResumoMesCapsulaDTO>
     */
    public function executar(Usuario $usuario, FiltroFonteMusica $fonte): array
    {
        return $this->cacheAnalise->lembrar($usuario, 'capsula|meses', fn (): array => $this->calcular($usuario, $fonte), $fonte);
    }

    /**
     * @return list<ResumoMesCapsulaDTO>
     */
    private function calcular(Usuario $usuario, FiltroFonteMusica $fonte): array
    {
        $resumos = [];

        foreach ($this->analiseRepository->listarMesesDisponiveis($usuario, $fonte) as $mesInfo) {
            $periodo = PeriodoAnaliseSpotifyDTO::doMes($mesInfo->ano(), $mesInfo->mes());
            $topMusica = $this->analiseRepository->listarRankingMusicas($usuario, $periodo, $fonte, self::LIMITE_DESTAQUE)[0] ?? null;
            $topArtista = $this->analiseRepository->listarRankingArtistas($usuario, $periodo, $fonte, self::LIMITE_DESTAQUE)[0] ?? null;

            $resumos[] = new ResumoMesCapsulaDTO(
                ano: $mesInfo->ano(),
                mes: $mesInfo->mes(),
                rotulo: $mesInfo->rotulo(),
                totalMinutos: $mesInfo->totalMinutos(),
                totalStreams: $mesInfo->totalReproducoes(),
                musicaMaisOuvida: null === $topMusica ? null : sprintf('%s — %s', $topMusica->nomeFaixa, $topMusica->artista),
                artistaMaisOuvido: $topArtista?->nome,
                isEmAndamento: PeriodoMesSpotifyDTO::criar($mesInfo->ano(), $mesInfo->mes())->isMesCorrente(),
            );
        }

        return $resumos;
    }
}
