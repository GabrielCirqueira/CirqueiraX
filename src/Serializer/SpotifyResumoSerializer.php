<?php

declare(strict_types=1);

namespace App\Serializer;

use App\DataObject\Spotify\Analise\AlbumAnaliseSpotifyDTO;
use App\DataObject\Spotify\CuriosidadesSpotifyDTO;
use App\DataObject\Spotify\ItemRankingArtistaDTO;
use App\DataObject\Spotify\ItemRankingMusicaDTO;
use App\DataObject\Spotify\MapaImagensSpotifyDTO;
use App\DataObject\Spotify\ResumoGeralSpotifyDTO;
use App\DataObject\Spotify\ResumoIntervaloSpotifyDTO;
use App\Entity\ImagemSpotify;

final readonly class SpotifyResumoSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function serializarResumo(
        ResumoGeralSpotifyDTO $resumo,
        ?MapaImagensSpotifyDTO $mapaImagens = null,
    ): array {
        return [
            'hoje' => $this->serializarIntervalo($resumo->hoje(), $mapaImagens),
            'semana' => $this->serializarIntervalo($resumo->semana(), $mapaImagens),
            'curiosidades' => $this->serializarCuriosidades($resumo->curiosidades()),
        ];
    }

    /**
     * @param list<AlbumAnaliseSpotifyDTO> $topAlbuns
     *
     * @return array<string, mixed>
     */
    public function serializarIntervaloComPeriodo(
        ResumoIntervaloSpotifyDTO $intervalo,
        string $rotuloPeriodo,
        string $dataInicio,
        string $dataFim,
        ?MapaImagensSpotifyDTO $mapaImagens = null,
        array $topAlbuns = [],
    ): array {
        $dados = $this->serializarIntervalo($intervalo, $mapaImagens);
        $dados['rotuloPeriodo'] = $rotuloPeriodo;
        $dados['dataInicio'] = $dataInicio;
        $dados['dataFim'] = $dataFim;
        $dados['topAlbuns'] = array_map(static fn (AlbumAnaliseSpotifyDTO $album): array => $album->paraArray(), $topAlbuns);

        return $dados;
    }

    /**
     * @return array<string, mixed>
     */
    public function serializarIntervalo(
        ResumoIntervaloSpotifyDTO $intervalo,
        ?MapaImagensSpotifyDTO $mapaImagens = null,
    ): array {
        $topMusicas = [];
        foreach ($intervalo->topMusicas() as $indice => $item) {
            $topMusicas[] = $this->serializarItemMusica($item, $indice + 1, $mapaImagens);
        }

        $topArtistas = [];
        foreach ($intervalo->topArtistas() as $indice => $item) {
            $topArtistas[] = $this->serializarItemArtista($item, $indice + 1, $mapaImagens);
        }

        return [
            'totalMinutos' => $intervalo->totalMinutos(),
            'totalStreams' => $intervalo->totalStreams(),
            'variacaoMinutosPercentual' => $intervalo->variacaoMinutosPercentual(),
            'topMusicas' => $topMusicas,
            'topArtistas' => $topArtistas,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializarCuriosidades(CuriosidadesSpotifyDTO $curiosidades): array
    {
        return [
            'horarioPico' => $curiosidades->horarioPico(),
            'minutosHorarioPico' => $curiosidades->minutosHorarioPico(),
            'diaSemanaMaisOuvido' => $curiosidades->diaSemanaMaisOuvido(),
            'minutosDiaSemana' => $curiosidades->minutosDiaSemana(),
            'diaMaisLongoData' => $curiosidades->diaMaisLongoData(),
            'diaMaisLongoMinutos' => $curiosidades->diaMaisLongoMinutos(),
            'faixaMaisRepetidaNome' => $curiosidades->faixaMaisRepetidaNome(),
            'faixaMaisRepetidaArtista' => $curiosidades->faixaMaisRepetidaArtista(),
            'faixaMaisRepetidaVezes' => $curiosidades->faixaMaisRepetidaVezes(),
            'faixaMaisRepetidaData' => $curiosidades->faixaMaisRepetidaData(),
            'artistasDescobertosNoMes' => $curiosidades->artistasDescobertosNoMes(),
            'mediaMinutosDiarios' => $curiosidades->mediaMinutosDiarios(),
            'variacaoMediaDiariaPercentual' => $curiosidades->variacaoMediaDiariaPercentual(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializarItemMusica(
        ItemRankingMusicaDTO $item,
        int $posicao,
        ?MapaImagensSpotifyDTO $mapaImagens = null,
    ): array {
        $chave = ImagemSpotify::gerarChaveFaixa($item->codigoFaixa(), $item->artistaPrincipal(), $item->nomeFaixa());
        $imagemUrl = $mapaImagens?->obterImagem($chave);
        $urlSpotifyPadrao = ImagemSpotify::gerarUrlSpotifyFaixa(
            $item->codigoFaixa(),
            $item->artistaPrincipal(),
            $item->nomeFaixa(),
        );
        $urlSpotify = $mapaImagens?->obterUrlSpotify($chave, $urlSpotifyPadrao);

        return [
            'posicao' => $posicao,
            'codigoFaixa' => $item->codigoFaixa(),
            'nomeFaixa' => $item->nomeFaixa(),
            'artistaPrincipal' => $item->artistaPrincipal(),
            'album' => $item->album(),
            'totalStreams' => $item->totalStreams(),
            'totalMinutos' => $item->totalMinutos(),
            'urlSpotify' => $urlSpotify,
            'imagemUrl' => $imagemUrl,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializarItemArtista(
        ItemRankingArtistaDTO $item,
        int $posicao,
        ?MapaImagensSpotifyDTO $mapaImagens = null,
    ): array {
        $chave = ImagemSpotify::gerarChaveArtista($item->codigoArtista(), $item->nomeArtista());
        $imagemUrl = $mapaImagens?->obterImagem($chave);
        $urlSpotifyPadrao = ImagemSpotify::gerarUrlSpotifyArtista(
            $item->codigoArtista(),
            $item->nomeArtista(),
        );
        $urlSpotify = $mapaImagens?->obterUrlSpotify($chave, $urlSpotifyPadrao);

        return [
            'posicao' => $posicao,
            'nomeArtista' => $item->nomeArtista(),
            'codigoArtista' => $item->codigoArtista(),
            'totalStreams' => $item->totalStreams(),
            'totalMinutos' => $item->totalMinutos(),
            'urlSpotify' => $urlSpotify,
            'imagemUrl' => $imagemUrl,
        ];
    }
}
