<?php

declare(strict_types=1);

namespace App\Service\Musica;

use App\Repository\MusicaCatalogoRepository;
use App\Repository\VinculoMusicaSpotifyRepository;

final readonly class AtualizarArtistasMusicaSpotifyService
{
    public function __construct(
        private VinculoMusicaSpotifyRepository $vinculoRepository,
        private MusicaCatalogoRepository $musicaRepository,
        private ObterArtistaCatalogoService $obterArtista,
        private NormalizarTextoMusicaService $normalizador,
    ) {
    }

    /**
     * @param list<string> $artistas
     */
    public function executar(string $nomeFaixa, string $artistaPrincipal, array $artistas): void
    {
        $vinculo = $this->vinculoRepository->buscarPorIdentidade($this->normalizador->normalizar($nomeFaixa), $this->normalizador->normalizar($artistaPrincipal));
        if (null === $vinculo || $vinculo->musica()->confirmadaManualmente()) {
            return;
        }

        $musica = $vinculo->musica();
        foreach ($artistas as $nome) {
            $musica->adicionarArtista($this->obterArtista->executar($nome));
        }
        $this->musicaRepository->salvar($musica);
    }
}
