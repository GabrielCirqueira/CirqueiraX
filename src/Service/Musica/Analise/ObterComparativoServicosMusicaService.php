<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Enum\FonteReproducaoMusical;
use App\Enum\RenovacaoCacheAnalise;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class ObterComparativoServicosMusicaService
{
    private const int LIMITE_EXCLUSIVAS = 12;

    public function __construct(
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private MontarItensComImagemMusicaService $montarItensService,
        private CacheAnaliseSpotifyService $cacheAnalise,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function executar(Usuario $usuario): array
    {
        return $this->cacheAnalise->lembrar($usuario, 'comparativo-servicos', fn (): array => $this->calcular($usuario), FiltroFonteMusica::Todas, RenovacaoCacheAnalise::Continua);
    }

    /**
     * @return array<string, mixed>
     */
    private function calcular(Usuario $usuario): array
    {
        $soSpotify = $this->analiseRepository->listarMusicasExclusivasDaFonte($usuario, FonteReproducaoMusical::Spotify, self::LIMITE_EXCLUSIVAS);
        $soYoutube = $this->analiseRepository->listarMusicasExclusivasDaFonte($usuario, FonteReproducaoMusical::YoutubeMusic, self::LIMITE_EXCLUSIVAS);
        $comImagem = $this->montarItensService->aplicarEmListas($usuario, [...$soSpotify, ...$soYoutube]);
        $quantidadeSpotify = count($soSpotify);

        return [
            'meses' => array_map(static fn (array $mes): array => [
                'ano' => $mes['ano'],
                'mes' => $mes['mes'],
                'minutos' => $mes['minutos'],
                'porFonte' => $mes['porFonte'],
            ], $this->analiseRepository->calcularEvolucaoMensal($usuario, PeriodoAnaliseSpotifyDTO::todos(), FiltroFonteMusica::Todas)),
            'contagem' => $this->analiseRepository->contarMusicasPorExclusividade($usuario),
            'soSpotify' => array_slice($comImagem['musicas'], 0, $quantidadeSpotify),
            'soYoutubeMusic' => array_slice($comImagem['musicas'], $quantidadeSpotify),
        ];
    }
}
