<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\AlbumAnaliseSpotifyDTO;
use App\DataObject\Spotify\DetalheCapsulaComImagensDTO;
use App\DataObject\Spotify\ItemRankingArtistaCapsulaDTO;
use App\DataObject\Spotify\ItemRankingMusicaCapsulaDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Service\Spotify\EnriquecerImagensSpotifyService;

final readonly class ObterDetalheCapsulaService
{
    public function __construct(
        private CalcularCapsulaMensalService $calcularCapsulaService,
        private EnriquecerImagensSpotifyService $enriquecerImagensService,
    ) {
    }

    public function executar(Usuario $usuario, FiltroFonteMusica $fonte, int $ano, int $mes): DetalheCapsulaComImagensDTO
    {
        $capsula = $this->calcularCapsulaService->executar($usuario, $fonte, $ano, $mes);

        $faixas = [];
        $musicaDestaque = $capsula->musicaMaisOuvida();
        if (null !== $musicaDestaque && $musicaDestaque->temSpotify()) {
            $faixas[] = [
                'codigo' => $musicaDestaque->codigoFaixa(),
                'nome' => $musicaDestaque->nomeFaixa(),
                'artista' => $musicaDestaque->artistaPrincipal(),
            ];
        }

        foreach (array_filter($capsula->topMusicas(), static fn (ItemRankingMusicaCapsulaDTO $item): bool => $item->temSpotify()) as $item) {
            $faixas[] = [
                'codigo' => $item->codigoFaixa(),
                'nome' => $item->nomeFaixa(),
                'artista' => $item->artistaPrincipal(),
            ];
        }

        foreach (array_filter($capsula->topAlbuns(), static fn (AlbumAnaliseSpotifyDTO $album): bool => $album->temSpotify()) as $album) {
            $faixas[] = $album->paraEnriquecimento();
        }

        $artistas = [];
        $artistaDestaque = $capsula->artistaMaisOuvido();
        if (null !== $artistaDestaque && $artistaDestaque->temSpotify()) {
            $artistas[] = [
                'codigo' => $artistaDestaque->codigoArtista(),
                'nome' => $artistaDestaque->nomeArtista(),
            ];
        }

        foreach (array_filter($capsula->topArtistas(), static fn (ItemRankingArtistaCapsulaDTO $item): bool => $item->temSpotify()) as $item) {
            $artistas[] = [
                'codigo' => $item->codigoArtista(),
                'nome' => $item->nomeArtista(),
            ];
        }

        $mapaImagens = $this->enriquecerImagensService->enriquecerEAgendar(
            usuario: $usuario,
            faixas: $faixas,
            artistas: $artistas,
            prioridade: 1,
        );

        return new DetalheCapsulaComImagensDTO($capsula, $mapaImagens);
    }
}
