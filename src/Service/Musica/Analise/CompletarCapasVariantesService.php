<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\Entity\ImagemSpotify;
use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Service\Spotify\EnriquecerImagensSpotifyService;

final readonly class CompletarCapasVariantesService
{
    private const string FONTE_SPOTIFY = 'spotify';
    private const string FONTE_YOUTUBE_MUSIC = 'youtube_music';
    private const int PRIORIDADE_IMAGENS = 2;

    public function __construct(
        private EnriquecerImagensSpotifyService $enriquecerImagens,
    ) {
    }

    /**
     * @param list<array<string, mixed>> $variantes
     *
     * @return list<array<string, mixed>>
     */
    public function executar(Usuario $usuario, array $variantes): array
    {
        $faixas = [];
        foreach ($variantes as $variante) {
            if (self::FONTE_SPOTIFY !== $variante['fonte'] || null !== $variante['urlCapa']) {
                continue;
            }
            $faixas[] = $this->faixaSpotify($variante);
        }

        $mapa = [] === $faixas ? null : $this->enriquecerImagens->enriquecerEAgendar(
            usuario: $usuario,
            faixas: $faixas,
            artistas: [],
            prioridade: self::PRIORIDADE_IMAGENS,
        );

        return array_map(function (array $variante) use ($mapa): array {
            if (null !== $variante['urlCapa']) {
                return $variante;
            }

            $codigo = is_string($variante['codigo']) ? $variante['codigo'] : null;
            if (self::FONTE_YOUTUBE_MUSIC === $variante['fonte'] && null !== $codigo) {
                return [...$variante, 'urlCapa' => VideoYoutube::gerarUrlMiniatura($codigo)];
            }

            if (self::FONTE_SPOTIFY !== $variante['fonte'] || null === $mapa) {
                return $variante;
            }

            $faixa = $this->faixaSpotify($variante);

            return [...$variante, 'urlCapa' => $mapa->obterImagem(ImagemSpotify::gerarChaveFaixa($faixa['codigo'], $faixa['artista'], $faixa['nome']))];
        }, $variantes);
    }

    /**
     * @param array<string, mixed> $variante
     *
     * @return array{codigo: ?string, nome: string, artista: string}
     */
    private function faixaSpotify(array $variante): array
    {
        return [
            'codigo' => is_string($variante['codigo']) ? $variante['codigo'] : null,
            'nome' => (string) $variante['titulo'],
            'artista' => (string) $variante['canal'],
        ];
    }
}
