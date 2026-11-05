<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\ItemHistoricoImportadoDTO;
use App\DataObject\Spotify\ResultadoImportacaoHistoricoSpotifyDTO;
use App\Entity\ReproducaoSpotify;
use App\Entity\Usuario;
use App\Interface\LeitorArquivoHistoricoSpotifyInterface;
use App\Repository\ReproducaoSpotifyRepository;

final readonly class DeduplicarEImportarHistoricoSpotifyService
{
    private const int TAMANHO_LOTE = 500;
    private const int JANELA_TOLERANCIA_ESTENDIDA_SEGUNDOS = 90;
    private const int JANELA_TOLERANCIA_BASICA_SEGUNDOS = 180;
    private const int MARGEM_MAXIMA_CONSULTA_SEGUNDOS = 180;

    public function __construct(
        private LeitorArquivoHistoricoSpotifyInterface $leitorArquivo,
        private ReproducaoSpotifyRepository $reproducaoRepository,
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

        $inicio = (new \DateTimeImmutable())->setTimestamp($minTimestamp - self::MARGEM_MAXIMA_CONSULTA_SEGUNDOS);
        $fim = (new \DateTimeImmutable())->setTimestamp($maxTimestamp + self::MARGEM_MAXIMA_CONSULTA_SEGUNDOS);

        $existentes = $this->reproducaoRepository->buscarPorIntervaloTempo($usuario, $inicio, $fim);

        /** @var array<string, true> $chavesNoLote */
        $chavesNoLote = [];
        foreach ($existentes as $existente) {
            $chavesNoLote[$existente->chaveDeduplicacao()] = true;
        }

        foreach ($lote as $item) {
            $janelaTolerancia = $item->fonte()->isImportacaoEstendida()
                ? self::JANELA_TOLERANCIA_ESTENDIDA_SEGUNDOS
                : self::JANELA_TOLERANCIA_BASICA_SEGUNDOS;

            $candidatoEncontrado = null;
            $itemTimestamp = $item->tocadaEm()->getTimestamp();

            foreach ($existentes as $candidato) {
                if (!$candidato->isMesmaFaixa($item->codigoFaixa(), $item->nomeFaixa(), $item->artistaPrincipal())) {
                    continue;
                }

                $diferencaSegundos = abs($candidato->tocadaEm()->getTimestamp() - $itemTimestamp);
                if ($diferencaSegundos <= $janelaTolerancia) {
                    $candidatoEncontrado = $candidato;
                    break;
                }
            }

            if (null !== $candidatoEncontrado) {
                if ($candidatoEncontrado->podeSerSubstituidaPor($item->fonte())) {
                    $candidatoEncontrado->atualizarDeImportacao(
                        msReproduzidos: $item->msReproduzidos(),
                        novaFonte: $item->fonte(),
                        codigoFaixa: $item->codigoFaixa(),
                        album: $item->album(),
                    );
                    $substituidos++;
                } else {
                    $ignorados++;
                }
                continue;
            }

            $chaveDeduplicacao = ReproducaoSpotify::gerarChaveDeduplicacao(
                $item->codigoFaixa(),
                $item->nomeFaixa(),
                $item->artistaPrincipal(),
                $item->tocadaEm(),
            );

            if (isset($chavesNoLote[$chaveDeduplicacao])) {
                $ignorados++;
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

            $this->reproducaoRepository->salvar($novaReproducao, flush: false);
            $existentes[] = $novaReproducao;
            $chavesNoLote[$chaveDeduplicacao] = true;
            $novos++;
        }

        $this->reproducaoRepository->flush();
        $this->reproducaoRepository->limparCache();
    }
}
