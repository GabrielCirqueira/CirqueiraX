<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\ContaYoutubeMusic;
use App\Entity\ReproducaoYoutube;
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
    public function serializar(?ContaYoutubeMusic $conta, int $totalReproducoesColetadas = 0, ?ReproducaoYoutube $ultimaDetectada = null): array
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
