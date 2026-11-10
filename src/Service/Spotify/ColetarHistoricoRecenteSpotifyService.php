<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\ItemReproducaoRecenteDTO;
use App\DataObject\Spotify\ResultadoColetaHistoricoSpotifyDTO;
use App\Entity\ContaSpotify;
use App\Entity\ReproducaoSpotify;
use App\Enum\FonteReproducaoSpotify;
use App\Exception\Spotify\SpotifyException;
use App\Interface\SpotifyInterface;
use App\Repository\ArtistaFaixaSpotifyRepository;
use App\Repository\ContaSpotifyRepository;
use App\Repository\ReproducaoSpotifyRepository;
use Psr\Log\LoggerInterface;

final readonly class ColetarHistoricoRecenteSpotifyService
{
    private const int LIMITE_PADRAO_COLETA = 50;
    private const int CODIGO_LIMITE_REQUISICOES = 429;
    private const int INTERVALO_COLETA_SEGUNDOS = 300;

    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ReproducaoSpotifyRepository $reproducaoSpotifyRepository,
        private SpotifyInterface $spotifyClient,
        private ObterTokenValidoSpotifyService $obterTokenValidoSpotifyService,
        private EnriquecerImagensSpotifyService $enriquecerImagensService,
        private EstimarTempoReproduzidoSpotifyService $estimarTempoReproduzidoService,
        private CacheAnaliseSpotifyService $cacheAnalise,
        private ArtistaFaixaSpotifyRepository $artistaFaixaRepository,
        private LoggerInterface $logger,
        private ControleLimiteSpotifyService $controleLimite,
    ) {
    }

    public function executarParaConta(ContaSpotify $conta): ResultadoColetaHistoricoSpotifyDTO
    {
        if (!$conta->isConectada() || $this->controleLimite->estaBloqueado()) {
            return new ResultadoColetaHistoricoSpotifyDTO(0, 0, 0, $conta->cursorUltimaReproducaoMs());
        }

        try {
            $accessToken = $this->obterTokenValidoSpotifyService->executar($conta);
        } catch (SpotifyException $e) {
            $this->logger->warning('Falha ao obter token válido para coleta do Spotify.', [
                'conta' => $conta->uuid()->toRfc4122(),
                'usuario' => $conta->usuario()->getId(),
                'erro' => $e->getMessage(),
            ]);

            return new ResultadoColetaHistoricoSpotifyDTO(0, 0, 0, $conta->cursorUltimaReproducaoMs());
        }

        $cursorAtual = $conta->cursorUltimaReproducaoMs();

        try {
            $lista = $this->spotifyClient->listarReproducoesRecentes(
                $accessToken,
                null,
                self::LIMITE_PADRAO_COLETA,
            );
        } catch (SpotifyException $e) {
            if (self::CODIGO_LIMITE_REQUISICOES === $e->getCode()) {
                $this->controleLimite->registrarBloqueio($e->segundosEspera(), ControleLimiteSpotifyService::ORIGEM_COLETA, self::INTERVALO_COLETA_SEGUNDOS);
            }
            $this->logger->warning('Erro retornado pela API do Spotify durante a coleta do histórico.', [
                'conta' => $conta->uuid()->toRfc4122(),
                'usuario' => $conta->usuario()->getId(),
                'codigo' => $e->getCode(),
                'erro' => $e->getMessage(),
            ]);

            return new ResultadoColetaHistoricoSpotifyDTO(0, 0, 0, $cursorAtual);
        }

        $this->controleLimite->registrarColetaConcluida();

        if (empty($lista->itens)) {
            $conta->registrarColeta();
            $this->contaSpotifyRepository->salvar($conta);

            return new ResultadoColetaHistoricoSpotifyDTO(0, 0, 0, $cursorAtual);
        }

        $itensOrdenados = $lista->itens;
        usort(
            $itensOrdenados,
            static fn (ItemReproducaoRecenteDTO $a, ItemReproducaoRecenteDTO $b): int => $a->tocadoEm <=> $b->tocadoEm,
        );

        /** @var array<int, string> $chavesPorItem */
        $chavesPorItem = [];
        foreach ($itensOrdenados as $indice => $item) {
            $chavesPorItem[$indice] = ReproducaoSpotify::gerarChaveDeduplicacao(
                $item->codigoFaixa,
                $item->nomeFaixa,
                $item->artistaPrincipal,
                $item->tocadoEm,
            );
        }

        $chavesUnicas = array_values(array_unique($chavesPorItem));
        $chavesExistentes = $this->reproducaoSpotifyRepository->buscarChavesExistentesDoUsuario(
            $conta->usuario(),
            $chavesUnicas,
        );

        $mapaChavesExistentes = array_fill_keys($chavesExistentes, true);
        $chavesProcessadasNoLote = [];
        $totalNovas = 0;
        $totalDuplicadas = 0;
        $maiorTimestampMs = $lista->cursorAfterMs;
        $fimReproducaoAnterior = $this->reproducaoSpotifyRepository->buscarUltimaTocadaAntesDe(
            $conta->usuario(),
            $itensOrdenados[0]->tocadoEm,
        );

        foreach ($itensOrdenados as $indice => $item) {
            $chave = $chavesPorItem[$indice];
            $timestampItemMs = (int) ($item->tocadoEm->getTimestamp() * 1000);

            if (null === $maiorTimestampMs || $timestampItemMs > $maiorTimestampMs) {
                $maiorTimestampMs = $timestampItemMs;
            }

            $msReproduzidos = $this->estimarTempoReproduzidoService->estimar(
                $item->duracaoMs,
                $fimReproducaoAnterior,
                $item->tocadoEm,
            );
            $fimReproducaoAnterior = $item->tocadoEm;

            if (isset($mapaChavesExistentes[$chave]) || isset($chavesProcessadasNoLote[$chave])) {
                ++$totalDuplicadas;
                continue;
            }

            $chavesProcessadasNoLote[$chave] = true;

            $reproducao = new ReproducaoSpotify(
                usuario: $conta->usuario(),
                codigoFaixa: $item->codigoFaixa,
                nomeFaixa: $item->nomeFaixa,
                artistaPrincipal: $item->artistaPrincipal,
                codigoArtistaPrincipal: $item->codigoArtistaPrincipal,
                demaisArtistas: !empty($item->demaisArtistas) ? $item->demaisArtistas : null,
                album: $item->nomeAlbum,
                duracaoMs: $item->duracaoMs > 0 ? $item->duracaoMs : null,
                msReproduzidos: $msReproduzidos,
                tocadaEm: $item->tocadoEm,
                fonte: FonteReproducaoSpotify::Api,
            );

            $this->reproducaoSpotifyRepository->salvar($reproducao, false);
            ++$totalNovas;

            if (null !== $item->codigoFaixa) {
                $this->artistaFaixaRepository->registrarArtistasDaFaixa($item->codigoFaixa, [
                    ['nome' => $item->artistaPrincipal, 'codigo' => $item->codigoArtistaPrincipal],
                    ...array_map(static fn (string $nome): array => ['nome' => $nome, 'codigo' => null], array_values($item->demaisArtistas)),
                ]);
            }

            if (null !== $item->urlCapa && null !== $item->codigoFaixa && '' !== trim($item->codigoFaixa)) {
                $this->enriquecerImagensService->catalogarCapaColetada(
                    $item->codigoFaixa,
                    $item->nomeFaixa,
                    $item->artistaPrincipal,
                    $item->urlCapa,
                );
            }
        }

        $conta->registrarColeta($maiorTimestampMs);
        $this->contaSpotifyRepository->salvar($conta, false);

        $this->reproducaoSpotifyRepository->flush();
        $this->contaSpotifyRepository->flush();

        if ($totalNovas > 0) {
            $this->cacheAnalise->invalidar($conta->usuario());
        }

        return new ResultadoColetaHistoricoSpotifyDTO(
            count($lista->itens),
            $totalNovas,
            $totalDuplicadas,
            $conta->cursorUltimaReproducaoMs(),
        );
    }

    /**
     * @return array<string, ResultadoColetaHistoricoSpotifyDTO>
     */
    public function executarParaTodasContasConectadas(): array
    {
        $contas = $this->contaSpotifyRepository->listarConectadas();
        $resultados = [];

        foreach ($contas as $conta) {
            if (!$conta->isConectada()) {
                continue;
            }

            $chaveConta = $conta->uuid()->toRfc4122();
            $resultados[$chaveConta] = $this->executarParaConta($conta);
        }

        return $resultados;
    }
}
