<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\ItemRankingArtistaDTO;
use App\DataObject\Spotify\ItemRankingMusicaDTO;
use App\DataObject\Spotify\ResumoIntervaloSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Repository\AnaliseReproducaoMusicalRepository;

final readonly class MontarResumoIntervaloMusicaService
{
    private const int PERCENTUAL = 100;

    public function __construct(
        private AnaliseReproducaoMusicalRepository $analiseRepository,
    ) {}

    public function montar(
        Usuario $usuario,
        FiltroFonteMusica $fonte,
        PeriodoAnaliseSpotifyDTO $periodo,
        ?PeriodoAnaliseSpotifyDTO $comparacao,
        int $limite,
    ): ResumoIntervaloSpotifyDTO {
        $totais = $this->analiseRepository->calcularTotais($usuario, $periodo, $fonte);
        $minutosAnteriores = null === $comparacao ? 0 : $this->analiseRepository->calcularTotais($usuario, $comparacao, $fonte)['minutos'];

        return new ResumoIntervaloSpotifyDTO(
            totalMinutos: $totais['minutos'],
            totalStreams: $totais['streams'],
            variacaoMinutosPercentual: $minutosAnteriores > 0
                ? (int) round((($totais['minutos'] - $minutosAnteriores) / $minutosAnteriores) * self::PERCENTUAL)
                : null,
            topMusicas: array_map(
                static fn (MusicaAnaliseSpotifyDTO $musica): ItemRankingMusicaDTO => ItemRankingMusicaDTO::daAnalise($musica),
                $this->analiseRepository->listarRankingMusicas($usuario, $periodo, $fonte, $limite),
            ),
            topArtistas: array_map(
                static fn (ArtistaAnaliseSpotifyDTO $artista): ItemRankingArtistaDTO => ItemRankingArtistaDTO::daAnalise($artista),
                $this->analiseRepository->listarRankingArtistas($usuario, $periodo, $fonte, $limite),
            ),
        );
    }

    /**
     * @return list<array{codigo: ?string, nome: string, artista: string}>
     */
    public function listarFaixasParaImagens(ResumoIntervaloSpotifyDTO $resumo): array
    {
        $faixas = [];
        foreach ($resumo->topMusicas() as $musica) {
            if ($musica->temSpotify()) {
                $faixas[] = ['codigo' => $musica->codigoFaixa(), 'nome' => $musica->nomeFaixa(), 'artista' => $musica->artistaPrincipal()];
            }
        }

        return $faixas;
    }

    /**
     * @return list<array{codigo: ?string, nome: string}>
     */
    public function listarArtistasParaImagens(ResumoIntervaloSpotifyDTO $resumo): array
    {
        $artistas = [];
        foreach ($resumo->topArtistas() as $artista) {
            if ($artista->temSpotify()) {
                $artistas[] = ['codigo' => $artista->codigoArtista(), 'nome' => $artista->nomeArtista()];
            }
        }

        return $artistas;
    }
}
