<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\PeriodoMesSpotifyDTO;
use App\DataObject\Spotify\ResumoMesCapsulaDTO;
use App\Entity\Usuario;
use App\Repository\ReproducaoSpotifyRepository;

final readonly class ListarMesesCapsulaService
{
    public function __construct(
        private ReproducaoSpotifyRepository $reproducaoRepository,
    ) {
    }

    /**
     * @return array<int, ResumoMesCapsulaDTO>
     */
    public function executar(Usuario $usuario): array
    {
        $mesesDisponiveis = $this->reproducaoRepository->listarMesesDisponiveis($usuario);
        $resumos = [];

        foreach ($mesesDisponiveis as $mesInfo) {
            $periodo = PeriodoMesSpotifyDTO::criar($mesInfo->ano(), $mesInfo->mes());

            $topMusica = $this->reproducaoRepository->obterRankingMusicasMes(
                usuario: $usuario,
                periodo: $periodo,
                limite: 1,
            );

            $topArtista = $this->reproducaoRepository->obterRankingArtistasMes(
                usuario: $usuario,
                periodo: $periodo,
                limite: 1,
            );

            $nomeMusica = !empty($topMusica)
                ? sprintf('%s — %s', $topMusica[0]->nomeFaixa(), $topMusica[0]->artistaPrincipal())
                : null;

            $nomeArtista = !empty($topArtista)
                ? $topArtista[0]->nomeArtista()
                : null;

            $resumos[] = new ResumoMesCapsulaDTO(
                ano: $mesInfo->ano(),
                mes: $mesInfo->mes(),
                rotulo: $mesInfo->rotulo(),
                totalMinutos: $mesInfo->totalMinutos(),
                totalStreams: $mesInfo->totalReproducoes(),
                musicaMaisOuvida: $nomeMusica,
                artistaMaisOuvido: $nomeArtista,
                isEmAndamento: $periodo->isMesCorrente(),
            );
        }

        return $resumos;
    }
}
