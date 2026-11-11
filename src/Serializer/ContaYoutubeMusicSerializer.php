<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\ContaYoutubeMusic;
use DateTimeInterface;

final class ContaYoutubeMusicSerializer
{
    private const string STATUS_NAO_CONFIGURADO = 'nao_configurado';

    /**
     * @return array<string, mixed>
     */
    public function serializar(?ContaYoutubeMusic $conta, int $totalReproducoesColetadas = 0): array
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
        ];
    }
}
