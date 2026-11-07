<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\RecordesSpotifyDTO;
use App\DataObject\Spotify\Analise\RepeticaoDiariaSpotifyDTO;
use App\Entity\Usuario;
use App\Repository\AnaliseReproducaoSpotifyRepository;

final readonly class ObterRecordesSpotifyService
{
    public function __construct(
        private CacheAnaliseSpotifyService $cacheAnalise,
        private AnaliseReproducaoSpotifyRepository $analiseRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
        private CalcularSequenciasSpotifyService $calcularSequenciasService,
    ) {}

    public function executar(Usuario $usuario): RecordesSpotifyDTO
    {
        return $this->cacheAnalise->lembrar($usuario, 'recordes', fn (): RecordesSpotifyDTO => $this->calcular($usuario));
    }

    private function calcular(Usuario $usuario): RecordesSpotifyDTO
    {
        $todos = PeriodoAnaliseSpotifyDTO::todos();
        $musicas = $this->analiseRepository->listarRankingMusicas($usuario, $todos, 1);
        $artistas = $this->analiseRepository->listarRankingArtistas($usuario, $todos, 1);
        $repeticao = RepeticaoDiariaSpotifyDTO::deArray($this->analiseRepository->buscarMaiorRepeticaoDiaria($usuario, $todos));
        $faixasComImagem = null === $repeticao ? $musicas : [...$musicas, $repeticao->musica];
        $mapa = $this->aplicarImagensService->mapear($usuario, $faixasComImagem, $artistas);
        $meses = $this->analiseRepository->calcularEvolucaoMensal($usuario, $todos);
        usort($meses, static fn (array $a, array $b): int => $b['minutos'] <=> $a['minutos']);

        return new RecordesSpotifyDTO(
            totais: $this->analiseRepository->calcularTotais($usuario, $todos),
            sequencias: $this->calcularSequenciasService->calcular(
                $this->analiseRepository->listarDiasOuvidos($usuario, $todos),
                PeriodoAnaliseSpotifyDTO::agoraCalendario(),
            ),
            diaRecorde: $this->analiseRepository->buscarDiaRecorde($usuario, $todos),
            mesRecorde: $meses[0] ?? null,
            musicaMaisOuvida: ($this->aplicarImagensService->aplicar($musicas, $mapa))[0] ?? null,
            artistaMaisHoras: ($this->aplicarImagensService->aplicar($artistas, $mapa))[0] ?? null,
            maiorRepeticaoDiaria: null === $repeticao
                ? null
                : new RepeticaoDiariaSpotifyDTO($repeticao->musica->comImagem($mapa), $repeticao->vezes, $repeticao->data),
        );
    }
}
