<?php

declare(strict_types=1);

namespace App\Serializer;

use App\DataObject\Spotify\Analise\AlbumAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\DataObject\Spotify\CapsulaMensalSpotifyDTO;
use App\DataObject\Spotify\ItemRankingArtistaCapsulaDTO;
use App\DataObject\Spotify\ItemRankingMusicaCapsulaDTO;
use App\DataObject\Spotify\MapaImagensSpotifyDTO;
use App\DataObject\Spotify\MinutosPorDiaDTO;
use App\DataObject\Spotify\ResumoMesCapsulaDTO;
use App\Entity\ImagemSpotify;
use DateTimeInterface;

final readonly class SpotifyCapsulaSerializer
{
    /**
     * @param array<int, ResumoMesCapsulaDTO> $meses
     * @return array<int, array<string, mixed>>
     */
    public function serializarListaMeses(array $meses): array
    {
        return array_map(static fn (ResumoMesCapsulaDTO $m): array => [
            'ano' => $m->ano(),
            'mes' => $m->mes(),
            'rotulo' => $m->rotulo(),
            'totalMinutos' => $m->totalMinutos(),
            'totalStreams' => $m->totalStreams(),
            'musicaMaisOuvida' => $m->musicaMaisOuvida(),
            'artistaMaisOuvido' => $m->artistaMaisOuvido(),
            'isEmAndamento' => $m->isEmAndamento(),
        ], $meses);
    }

    /**
     * @return array<string, mixed>
     */
    public function serializarCapsula(
        CapsulaMensalSpotifyDTO $capsula,
        ?MapaImagensSpotifyDTO $mapaImagens = null,
    ): array {
        return [
            'ano' => $capsula->ano(),
            'mes' => $capsula->mes(),
            'rotulo' => $capsula->rotulo(),
            'emAndamento' => $capsula->isEmAndamento(),
            'calculadoEm' => $capsula->calculadoEm()->format(DateTimeInterface::ATOM),
            'totalMinutos' => $capsula->totalMinutos(),
            'totalStreams' => $capsula->totalStreams(),
            'faixasDistintas' => $capsula->faixasDistintas(),
            'variacaoFaixasDistintasPercentual' => $capsula->variacaoFaixasDistintasPercentual(),
            'musicaMaisOuvida' => null !== $capsula->musicaMaisOuvida()
                ? $this->serializarItemMusica($capsula->musicaMaisOuvida(), $mapaImagens)
                : null,
            'artistaMaisOuvido' => null !== $capsula->artistaMaisOuvido()
                ? $this->serializarItemArtista($capsula->artistaMaisOuvido(), $mapaImagens)
                : null,
            'topMusicas' => array_map(
                fn (ItemRankingMusicaCapsulaDTO $item): array => $this->serializarItemMusica($item, $mapaImagens),
                $capsula->topMusicas(),
            ),
            'topArtistas' => array_map(
                fn (ItemRankingArtistaCapsulaDTO $item): array => $this->serializarItemArtista($item, $mapaImagens),
                $capsula->topArtistas(),
            ),
            'topAlbuns' => array_map(
                static fn (AlbumAnaliseSpotifyDTO $album): array => (null === $mapaImagens ? $album : $album->comImagem($mapaImagens))->paraArray(),
                $capsula->topAlbuns(),
            ),
            'minutosPorDia' => array_map(static fn (MinutosPorDiaDTO $m): array => [
                'data' => $m->data(),
                'dia' => $m->dia(),
                'minutos' => $m->minutos(),
            ], $capsula->minutosPorDia()),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializarItemMusica(
        ItemRankingMusicaCapsulaDTO $item,
        ?MapaImagensSpotifyDTO $mapaImagens = null,
    ): array {
        $chave = ImagemSpotify::gerarChaveFaixa($item->codigoFaixa(), $item->artistaPrincipal(), $item->nomeFaixa());
        $imagemUrl = $mapaImagens?->obterImagem($chave);
        $urlSpotify = $mapaImagens?->obterUrlSpotify($chave, $item->urlSpotify());

        return $this->complementarMusica([
            'posicao' => $item->posicao(),
            'codigoFaixa' => $item->codigoFaixa(),
            'nomeFaixa' => $item->nomeFaixa(),
            'artistaPrincipal' => $item->artistaPrincipal(),
            'album' => $item->album(),
            'totalStreams' => $item->totalStreams(),
            'totalMinutos' => $item->totalMinutos(),
            'movimento' => $item->movimento(),
            'isEstreia' => $item->isEstreia(),
            'mesesNoTop5' => $item->mesesNoTop5(),
            'urlSpotify' => $urlSpotify,
            'imagemUrl' => $imagemUrl,
        ], $item->analise(), $mapaImagens);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializarItemArtista(
        ItemRankingArtistaCapsulaDTO $item,
        ?MapaImagensSpotifyDTO $mapaImagens = null,
    ): array {
        $chave = ImagemSpotify::gerarChaveArtista($item->codigoArtista(), $item->nomeArtista());
        $imagemUrl = $mapaImagens?->obterImagem($chave);
        $urlSpotify = $mapaImagens?->obterUrlSpotify($chave, $item->urlSpotify());

        return $this->complementarArtista([
            'posicao' => $item->posicao(),
            'nomeArtista' => $item->nomeArtista(),
            'codigoArtista' => $item->codigoArtista(),
            'totalStreams' => $item->totalStreams(),
            'totalMinutos' => $item->totalMinutos(),
            'movimento' => $item->movimento(),
            'isEstreia' => $item->isEstreia(),
            'urlSpotify' => $urlSpotify,
            'imagemUrl' => $imagemUrl,
        ], $item->analise(), $mapaImagens);
    }

    /**
     * @param array<string, mixed> $dados
     *
     * @return array<string, mixed>
     */
    private function complementarMusica(array $dados, ?MusicaAnaliseSpotifyDTO $analise, ?MapaImagensSpotifyDTO $mapaImagens): array
    {
        if (null === $analise) {
            return $dados;
        }

        $completa = null === $mapaImagens ? $analise : $analise->comImagem($mapaImagens);

        return [
            ...$dados,
            'imagemUrl' => $completa->imagemUrl,
            'urlSpotify' => $completa->urlSpotify,
            'musicaUuid' => $completa->musicaUuid,
            'artistas' => $completa->artistas,
            'fontes' => $completa->fontes,
            'porFonte' => $completa->porFonte,
            'mashup' => $completa->mashup,
            'estimado' => $completa->estimado,
            'urlYoutubeMusic' => $completa->urlYoutubeMusic,
        ];
    }

    /**
     * @param array<string, mixed> $dados
     *
     * @return array<string, mixed>
     */
    private function complementarArtista(array $dados, ?ArtistaAnaliseSpotifyDTO $analise, ?MapaImagensSpotifyDTO $mapaImagens): array
    {
        if (null === $analise) {
            return $dados;
        }

        $completo = null === $mapaImagens ? $analise : $analise->comImagem($mapaImagens);

        return [
            ...$dados,
            'imagemUrl' => $completo->imagemUrl,
            'urlSpotify' => $completo->urlSpotify,
            'artistaUuid' => $completo->artistaUuid,
            'fontes' => $completo->fontes,
            'porFonte' => $completo->porFonte,
            'estimado' => $completo->estimado,
        ];
    }
}
