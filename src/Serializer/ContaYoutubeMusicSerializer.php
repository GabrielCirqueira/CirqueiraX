<?php

declare(strict_types=1);

namespace App\Serializer;

use App\DataObject\YoutubeMusic\ResumoExtensaoYoutubeDTO;
use App\Entity\ArtistaCatalogo;
use App\Entity\ContaYoutubeMusic;
use App\Entity\ReproducaoYoutube;
use App\Enum\FonteCapturaYoutubeMusic;
use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;

final class ContaYoutubeMusicSerializer
{
    private const string STATUS_NAO_CONFIGURADO = 'nao_configurado';
    private const string FORMATO_GRAVADO = 'Y-m-d H:i:s';
    private const string FUSO_UTC = 'UTC';

    /**
     * @return array<string, mixed>
     */
    public function serializar(?ContaYoutubeMusic $conta, int $totalReproducoesColetadas = 0, ?ReproducaoYoutube $ultimaDetectada = null, ?ResumoExtensaoYoutubeDTO $extensao = null, FonteCapturaYoutubeMusic $fonteCaptura = FonteCapturaYoutubeMusic::Coletor): array
    {
        if (null === $conta) {
            return [
                'conectada' => false,
                'status' => self::STATUS_NAO_CONFIGURADO,
                'statusDescricao' => 'Não configurado',
                'nomeConta' => null,
                'conectadoEm' => null,
                'ultimaConsultaEm' => null,
                'ultimaNovidadeEm' => null,
                'erroMotivo' => null,
                'totalReproducoesColetadas' => $totalReproducoesColetadas,
                'ultimaDetectada' => $this->serializarUltimaDetectada($ultimaDetectada),
                'extensao' => $this->serializarExtensao($extensao),
                'fonteCaptura' => $fonteCaptura->value,
            ];
        }

        return [
            'conectada' => $conta->isConectada(),
            'status' => $conta->status()->value,
            'statusDescricao' => $conta->status()->descricao(),
            'nomeConta' => $conta->nomeConta(),
            'conectadoEm' => $conta->conectadoEm()?->format(DateTimeInterface::ATOM),
            'ultimaConsultaEm' => $conta->ultimaConsultaEm()?->format(DateTimeInterface::ATOM),
            'ultimaNovidadeEm' => $conta->ultimaNovidadeEm()?->format(DateTimeInterface::ATOM),
            'erroMotivo' => $conta->erroMotivo(),
            'totalReproducoesColetadas' => $totalReproducoesColetadas,
            'ultimaDetectada' => $this->serializarUltimaDetectada($ultimaDetectada),
            'extensao' => $this->serializarExtensao($extensao),
            'fonteCaptura' => $fonteCaptura->value,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializarExtensao(?ResumoExtensaoYoutubeDTO $extensao): array
    {
        return [
            'aparelhosAtivos' => $extensao->aparelhosAtivos ?? 0,
            'ultimoEventoEm' => $extensao?->ultimoEventoEm?->format(DateTimeInterface::ATOM),
            'tocandoAgora' => null === $extensao ? null : $this->serializarTocandoAgora($extensao),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function serializarTocandoAgora(ResumoExtensaoYoutubeDTO $extensao): ?array
    {
        $tocando = $extensao->tocandoAgora;
        if (null === $tocando) {
            return null;
        }

        $video = $tocando->video();
        $musica = $video->musica()?->musicaEfetiva();
        $artistas = null === $musica ? [] : array_map(static fn (ArtistaCatalogo $artista): string => $artista->nome(), $musica->artistas());

        return [
            'titulo' => $musica?->titulo() ?? $video->titulo(),
            'canal' => $video->canal(),
            'artistas' => [] === $artistas ? array_values(array_filter([$video->canal()])) : $artistas,
            'album' => $musica?->album(),
            'urlCapa' => $musica?->urlCapa() ?? $video->urlCapa(),
            'videoId' => $video->videoId(),
            'identificada' => null !== $musica,
            'inicioEm' => $tocando->tocadaEm()->format(DateTimeInterface::ATOM),
            'msOuvidos' => $tocando->msReproduzidos(),
            'duracaoMs' => $video->duracaoMs(),
            'atualizadoEm' => $tocando->extensaoAtualizadaEm()?->format(DateTimeInterface::ATOM),
            'pausada' => $tocando->isExtensaoPausada(),
            'vezesOuvida' => $extensao->vezesOuvidaTocando,
            'primeiraVezEm' => $extensao->primeiraVezTocandoEm?->format(DateTimeInterface::ATOM),
        ];
    }

    /**
     * @return array{titulo: string, canal: string, tocadaEm: ?string}|null
     */
    private function serializarUltimaDetectada(?ReproducaoYoutube $reproducao): ?array
    {
        if (null === $reproducao) {
            return null;
        }

        $utc = DateTimeImmutable::createFromFormat(self::FORMATO_GRAVADO, $reproducao->tocadaEm()->format(self::FORMATO_GRAVADO), new DateTimeZone(self::FUSO_UTC));

        return [
            'titulo' => $reproducao->video()->titulo(),
            'canal' => $reproducao->video()->canal(),
            'tocadaEm' => false === $utc ? null : $utc->format(DateTimeInterface::ATOM),
        ];
    }
}
