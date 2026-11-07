<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\ItemHistoricoImportadoDTO;
use App\DataObject\Spotify\ResultadoImportacaoHistoricoSpotifyDTO;
use App\Entity\ReproducaoSpotify;
use App\Entity\Usuario;
use App\Interface\LeitorArquivoHistoricoSpotifyInterface;
use App\Repository\ReproducaoSpotifyRepository;
use DateTimeImmutable;
use DateTimeZone;

final readonly class DeduplicarEImportarHistoricoSpotifyService
{
    private const int TAMANHO_LOTE = 500;
    private const int JANELA_TOLERANCIA_ESTENDIDA_SEGUNDOS = 90;
    private const int JANELA_TOLERANCIA_BASICA_SEGUNDOS = 180;
    private const int MARGEM_MAXIMA_CONSULTA_SEGUNDOS = 180;

    public function __construct(
        private LeitorArquivoHistoricoSpotifyInterface $leitorArquivo,
        private ReproducaoSpotifyRepository $reproducaoRepository,
        private CacheAnaliseSpotifyService $cacheAnalise,
    ) {}

    public function executar(string $caminhoArquivo, Usuario $usuario): ResultadoImportacaoHistoricoSpotifyDTO
    {
        $totalLidos = 0;
        $totalNovos = 0;
        $totalIgnorados = 0;
        $totalSubstituidos = 0;

        /** @var array<int, ItemHistoricoImportadoDTO> $lote */
        $lote = [];

        foreach ($this->leitorArquivo->ler($caminhoArquivo) as $item) {
            $totalLidos++;
            $lote[] = $item;

            if (count($lote) >= self::TAMANHO_LOTE) {
                $this->processarLote($lote, $usuario, $totalNovos, $totalIgnorados, $totalSubstituidos);
                $usuario = $this->reproducaoRepository->obterReferenciaUsuario($usuario);
                $lote = [];
            }
        }

        if (!empty($lote)) {
            $this->processarLote($lote, $usuario, $totalNovos, $totalIgnorados, $totalSubstituidos);
        }

        return new ResultadoImportacaoHistoricoSpotifyDTO(
            totalLidos: $totalLidos,
            totalNovos: $totalNovos,
            totalIgnorados: $totalIgnorados,
            totalSubstituidos: $totalSubstituidos,
        );
    }

    /**
     * @param array<int, ItemHistoricoImportadoDTO> $lote
     */
    private function processarLote(
        array $lote,
        Usuario $usuario,
        int &$novos,
        int &$ignorados,
        int &$substituidos,
    ): void {
        if (empty($lote)) {
            return;
        }

        $minTimestamp = null;
        $maxTimestamp = null;

        foreach ($lote as $item) {
            $timestamp = $item->tocadaEm()->getTimestamp();
            if (null === $minTimestamp || $timestamp < $minTimestamp) {
                $minTimestamp = $timestamp;
            }
            if (null === $maxTimestamp || $timestamp > $maxTimestamp) {
                $maxTimestamp = $timestamp;
            }
        }

        $existentes = $this->reproducaoRepository->buscarPorIntervaloTempo(
            $usuario,
            new DateTimeImmutable('@'.($minTimestamp - self::MARGEM_MAXIMA_CONSULTA_SEGUNDOS)),
            new DateTimeImmutable('@'.($maxTimestamp + self::MARGEM_MAXIMA_CONSULTA_SEGUNDOS)),
        );

        /** @var array<string, ReproducaoSpotify> $existentesPorChave */
        $existentesPorChave = [];
        foreach ($existentes as $existente) {
            $existentesPorChave[$existente->chaveDeduplicacao()] = $existente;
        }

        /** @var array<int, true> $candidatosUsados */
        $candidatosUsados = [];

        foreach ($lote as $item) {
            $chaveDeduplicacao = ReproducaoSpotify::gerarChaveDeduplicacao(
                $item->codigoFaixa(),
                $item->nomeFaixa(),
                $item->artistaPrincipal(),
                $item->tocadaEm(),
            );

            $candidatoEncontrado = $existentesPorChave[$chaveDeduplicacao]
                ?? $this->buscarCandidatoDeOutraFonte($item, $existentes, $candidatosUsados);

            if (null !== $candidatoEncontrado) {
                $candidatosUsados[spl_object_id($candidatoEncontrado)] = true;
                $candidatoEncontrado->registrarComportamento($item->pulada, $item->aleatorio);
                if (!$candidatoEncontrado->podeSerSubstituidaPor($item->fonte())) {
                    $ignorados++;
                    continue;
                }

                $candidatoEncontrado->atualizarDeImportacao(
                    msReproduzidos: $item->msReproduzidos(),
                    novaFonte: $item->fonte(),
                    codigoFaixa: $item->codigoFaixa(),
                    album: $item->album(),
                    tocadaEm: $item->fonte()->isImportacaoEstendida() ? $item->tocadaEm() : null,
                );
                $existentesPorChave[$candidatoEncontrado->chaveDeduplicacao()] = $candidatoEncontrado;
                $substituidos++;
                continue;
            }

            $album = null !== $item->album() && '' !== trim($item->album()) ? trim($item->album()) : 'Desconhecido';

            $novaReproducao = new ReproducaoSpotify(
                usuario: $usuario,
                codigoFaixa: $item->codigoFaixa(),
                nomeFaixa: $item->nomeFaixa(),
                artistaPrincipal: $item->artistaPrincipal(),
                codigoArtistaPrincipal: null,
                demaisArtistas: null,
                album: $album,
                duracaoMs: null,
                msReproduzidos: $item->msReproduzidos(),
                tocadaEm: $item->tocadaEm(),
                fonte: $item->fonte(),
            );
            $novaReproducao->registrarComportamento($item->pulada, $item->aleatorio);

            $this->reproducaoRepository->salvar($novaReproducao, flush: false);
            $existentes[] = $novaReproducao;
            $existentesPorChave[$chaveDeduplicacao] = $novaReproducao;
            $candidatosUsados[spl_object_id($novaReproducao)] = true;
            $novos++;
        }

        $this->reproducaoRepository->flush();
        $this->reproducaoRepository->limparCache();
        $this->cacheAnalise->invalidar($usuario);
    }

    /**
     * @param array<int, ReproducaoSpotify> $existentes
     * @param array<int, true>              $candidatosUsados
     */
    private function buscarCandidatoDeOutraFonte(
        ItemHistoricoImportadoDTO $item,
        array $existentes,
        array $candidatosUsados,
    ): ?ReproducaoSpotify {
        $janelaTolerancia = $item->fonte()->isImportacaoEstendida()
            ? self::JANELA_TOLERANCIA_ESTENDIDA_SEGUNDOS
            : self::JANELA_TOLERANCIA_BASICA_SEGUNDOS;
        $itemTimestamp = $item->tocadaEm()->getTimestamp();

        foreach ($existentes as $candidato) {
            if ($candidato->fonte() === $item->fonte() || isset($candidatosUsados[spl_object_id($candidato)])) {
                continue;
            }

            if (!$candidato->isMesmaFaixa($item->codigoFaixa(), $item->nomeFaixa(), $item->artistaPrincipal())) {
                continue;
            }

            if (abs($this->timestampGravadoEmUtc($candidato->tocadaEm()) - $itemTimestamp) <= $janelaTolerancia) {
                return $candidato;
            }
        }

        return null;
    }

    private function timestampGravadoEmUtc(DateTimeImmutable $momento): int
    {
        $momentoUtc = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $momento->format('Y-m-d H:i:s'), new DateTimeZone('UTC'));

        return false === $momentoUtc ? $momento->getTimestamp() : $momentoUtc->getTimestamp();
    }
}
