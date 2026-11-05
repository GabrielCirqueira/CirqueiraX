<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\DetalheCapsulaComImagensDTO;
use App\Entity\Usuario;

final readonly class ObterDetalheCapsulaService
{
    public function __construct(
        private CalcularCapsulaMensalService $calcularCapsulaService,
        private EnriquecerImagensSpotifyService $enriquecerImagensService,
    ) {
    }

    public function executar(Usuario $usuario, int $ano, int $mes): DetalheCapsulaComImagensDTO
    {
        $capsula = $this->calcularCapsulaService->executar($usuario, $ano, $mes);

        $faixas = [];
        $musicaDestaque = $capsula->musicaMaisOuvida();
        if (null !== $musicaDestaque) {
            $faixas[] = [
                'codigo' => $musicaDestaque->codigoFaixa(),
                'nome' => $musicaDestaque->nomeFaixa(),
                'artista' => $musicaDestaque->artistaPrincipal(),
            ];
        }

        foreach ($capsula->topMusicas() as $item) {
            $faixas[] = [
                'codigo' => $item->codigoFaixa(),
                'nome' => $item->nomeFaixa(),
                'artista' => $item->artistaPrincipal(),
            ];
        }

        $artistas = [];
        $artistaDestaque = $capsula->artistaMaisOuvido();
        if (null !== $artistaDestaque) {
            $artistas[] = [
                'codigo' => $artistaDestaque->codigoArtista(),
                'nome' => $artistaDestaque->nomeArtista(),
            ];
        }

        foreach ($capsula->topArtistas() as $item) {
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
