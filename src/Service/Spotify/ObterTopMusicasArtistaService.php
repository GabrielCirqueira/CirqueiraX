<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\ItemTopMusicaArtistaDTO;
use App\DataObject\Spotify\PeriodoMesSpotifyDTO;
use App\Entity\ImagemSpotify;
use App\Entity\Usuario;
use App\Repository\ReproducaoSpotifyRepository;

final readonly class ObterTopMusicasArtistaService
{
    public function __construct(
        private ReproducaoSpotifyRepository $reproducaoRepository,
        private EnriquecerImagensSpotifyService $enriquecerImagensService,
    ) {
    }

    /**
     * @return array<int, ItemTopMusicaArtistaDTO>
     */
    public function executar(
        Usuario $usuario,
        string $nomeArtista,
        ?int $ano = null,
        ?int $mes = null,
        int $limite = 5,
    ): array {
        $periodo = null;
        if (null !== $ano && null !== $mes && $mes >= 1 && $mes <= 12) {
            $periodo = PeriodoMesSpotifyDTO::criar($ano, $mes);
        }

        $linhas = $this->reproducaoRepository->obterMusicasMaisOuvidasDoArtista(
            usuario: $usuario,
            nomeArtista: $nomeArtista,
            periodo: $periodo,
            limite: $limite,
        );

        if (empty($linhas)) {
            return [];
        }

        $faixasParaEnriquecer = [];
        foreach ($linhas as $linha) {
            $faixasParaEnriquecer[] = [
                'codigo' => $linha['codigoFaixa'],
                'nome' => $linha['nomeFaixa'],
                'artista' => $nomeArtista,
            ];
        }

        $mapaImagens = $this->enriquecerImagensService->enriquecerEAgendar(
            usuario: $usuario,
            faixas: $faixasParaEnriquecer,
            artistas: [],
            prioridade: 2,
        );

        $resultado = [];
        foreach ($linhas as $linha) {
            $chave = ImagemSpotify::gerarChaveFaixa(
                $linha['codigoFaixa'],
                $nomeArtista,
                $linha['nomeFaixa'],
            );

            $imagemUrl = $mapaImagens->obterImagem($chave);
            $urlSpotifyPadrao = ImagemSpotify::gerarUrlSpotifyFaixa(
                $linha['codigoFaixa'],
                $nomeArtista,
                $linha['nomeFaixa'],
            );
            $urlSpotify = $mapaImagens->obterUrlSpotify($chave, $urlSpotifyPadrao);

            $resultado[] = new ItemTopMusicaArtistaDTO(
                nomeFaixa: $linha['nomeFaixa'],
                codigoFaixa: $linha['codigoFaixa'],
                album: $linha['album'],
                totalStreams: $linha['streams'],
                totalMinutos: $linha['totalMinutos'],
                urlSpotify: $urlSpotify,
                imagemUrl: $imagemUrl,
            );
        }

        return $resultado;
    }
}

