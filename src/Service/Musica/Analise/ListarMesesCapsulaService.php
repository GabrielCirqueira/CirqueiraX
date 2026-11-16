<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\PeriodoMesSpotifyDTO;
use App\DataObject\Spotify\ResumoMesCapsulaDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class ListarMesesCapsulaService
{
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
            $resumos[] = new ResumoMesCapsulaDTO(
                ano: $mesInfo->ano(),
                mes: $mesInfo->mes(),
                rotulo: $mesInfo->rotulo(),
                totalMinutos: $mesInfo->totalMinutos(),
                totalStreams: $mesInfo->totalReproducoes(),
                musicaMaisOuvida: null,
                artistaMaisOuvido: null,
                isEmAndamento: PeriodoMesSpotifyDTO::criar($mesInfo->ano(), $mesInfo->mes())->isMesCorrente(),
            );
        }

        return $resumos;
    }
}
