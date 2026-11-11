<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\ImportacaoYoutube;
use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;

final readonly class ImportacaoYoutubeSerializer
{
    private const string FORMATO_GRAVADO = 'Y-m-d H:i:s';
    private const string FUSO_UTC = 'UTC';
    private const int MICRODOLARES_POR_DOLAR = 1000000;

    /**
     * @return array<string, mixed>
     */
    public function serializar(ImportacaoYoutube $importacao): array
    {
        return [
            'uuid' => $importacao->uuid()->toRfc4122(),
            'status' => $importacao->status()->value,
            'statusDescricao' => $importacao->status()->descricao(),
            'etapa' => $importacao->etapa()->value,
            'etapaDescricao' => $importacao->etapa()->descricao(),
            'nomeArquivoOriginal' => $importacao->nomeArquivoOriginal(),
            'tamanhoBytes' => $importacao->tamanhoBytes(),
            'leitura' => [
                'totalLidos' => $importacao->totalLidos(),
                'totalDescartados' => $importacao->totalDescartados(),
                'totalNovos' => $importacao->totalNovos(),
                'totalIgnorados' => $importacao->totalIgnorados(),
                'totalUnificados' => $importacao->totalUnificados(),
                'totalVideosNovos' => $importacao->totalVideosNovos(),
                'primeiraReproducaoEm' => $this->formatarGravadoEmUtc($importacao->primeiraReproducaoEm()),
                'ultimaReproducaoEm' => $this->formatarGravadoEmUtc($importacao->ultimaReproducaoEm()),
            ],
            'previa' => [
                'descartadosPorRegra' => $importacao->totalDescartadosRegra(),
                'indisponiveis' => $importacao->totalIndisponiveis(),
                'semIa' => $importacao->totalSemIa(),
                'paraIa' => $importacao->totalParaIa(),
                'tokensEntradaEstimados' => $importacao->tokensEntradaEstimados(),
                'tokensSaidaEstimados' => $importacao->tokensSaidaEstimados(),
                'custoEstimadoUsd' => $importacao->custoEstimadoMicrodolares() / self::MICRODOLARES_POR_DOLAR,
            ],
            'classificacao' => [
                'classificados' => $importacao->totalClassificados(),
                'tokensEntradaReais' => $importacao->tokensEntradaReais(),
                'tokensSaidaReais' => $importacao->tokensSaidaReais(),
                'custoRealUsd' => $importacao->custoRealMicrodolares() / self::MICRODOLARES_POR_DOLAR,
                'confirmadaEm' => $importacao->confirmadaEm()?->format(DateTimeInterface::ATOM),
            ],
            'relatorio' => $importacao->relatorio(),
            'erroMotivo' => $importacao->erroMotivo(),
            'criadoEm' => $importacao->criadoEm()->format(DateTimeInterface::ATOM),
            'iniciadoEm' => $importacao->iniciadoEm()?->format(DateTimeInterface::ATOM),
            'concluidoEm' => $importacao->concluidoEm()?->format(DateTimeInterface::ATOM),
            'aguardandoConfirmacao' => $importacao->isAguardandoConfirmacao(),
            'isFinalizada' => $importacao->isFinalizada(),
        ];
    }

    private function formatarGravadoEmUtc(?DateTimeImmutable $momento): ?string
    {
        if (null === $momento) {
            return null;
        }

        $utc = DateTimeImmutable::createFromFormat(self::FORMATO_GRAVADO, $momento->format(self::FORMATO_GRAVADO), new DateTimeZone(self::FUSO_UTC));

        return false === $utc ? null : $utc->format(DateTimeInterface::ATOM);
    }
}
