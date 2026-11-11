<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\RecordesSpotifyDTO;
use App\DataObject\Spotify\Analise\RepeticaoDiariaSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Service\Spotify\CacheAnaliseSpotifyService;
use App\Service\Spotify\AplicarImagensAnaliseSpotifyService;
use App\Service\Spotify\CalcularSequenciasSpotifyService;
use App\Repository\AnaliseReproducaoMusicalRepository;

final readonly class ObterRecordesMusicaService
{
    public function __construct(
        private CacheAnaliseSpotifyService $cacheAnalise,
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
        private CalcularSequenciasSpotifyService $calcularSequenciasService,
    ) {}

    public function executar(Usuario $usuario, FiltroFonteMusica $fonte): RecordesSpotifyDTO
    {
        return $this->cacheAnalise->lembrar($usuario, 'recordes', fn (): RecordesSpotifyDTO => $this->calcular($usuario, $fonte), $fonte);
    }

    private function calcular(Usuario $usuario, FiltroFonteMusica $fonte): RecordesSpotifyDTO
    {
        $todos = PeriodoAnaliseSpotifyDTO::todos();
        $musicas = $this->analiseRepository->listarRankingMusicas($usuario, $todos, $fonte, 1);
        $artistas = $this->analiseRepository->listarRankingArtistas($usuario, $todos, $fonte, 1);
        $repeticao = RepeticaoDiariaSpotifyDTO::deArray($this->analiseRepository->buscarMaiorRepeticaoDiaria($usuario, $todos, $fonte));
        $faixasComImagem = null === $repeticao ? $musicas : [...$musicas, $repeticao->musica];
        $mapa = $this->aplicarImagensService->mapear($usuario, $faixasComImagem, $artistas);
        $meses = $this->analiseRepository->calcularEvolucaoMensal($usuario, $todos, $fonte);
        usort($meses, static fn (array $a, array $b): int => $b['minutos'] <=> $a['minutos']);

        return new RecordesSpotifyDTO(
            totais: $this->analiseRepository->calcularTotais($usuario, $todos, $fonte),
            sequencias: $this->calcularSequenciasService->calcular(
                $this->analiseRepository->listarDiasOuvidos($usuario, $todos, $fonte),
                PeriodoAnaliseSpotifyDTO::agoraCalendario(),
            ),
            diaRecorde: $this->analiseRepository->buscarDiaRecorde($usuario, $todos, $fonte),
            mesRecorde: $meses[0] ?? null,
            musicaMaisOuvida: ($this->aplicarImagensService->aplicar($musicas, $mapa))[0] ?? null,
            artistaMaisHoras: ($this->aplicarImagensService->aplicar($artistas, $mapa))[0] ?? null,
            maiorRepeticaoDiaria: null === $repeticao
                ? null
                : new RepeticaoDiariaSpotifyDTO($repeticao->musica->comImagem($mapa), $repeticao->vezes, $repeticao->data),
        );
    }
}
