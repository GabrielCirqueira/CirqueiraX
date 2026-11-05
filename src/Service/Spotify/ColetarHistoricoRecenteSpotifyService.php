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
use App\Repository\ContaSpotifyRepository;
use App\Repository\ReproducaoSpotifyRepository;
use Psr\Log\LoggerInterface;

final readonly class ColetarHistoricoRecenteSpotifyService
{
    private const int LIMITE_PADRAO_COLETA = 50;

    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ReproducaoSpotifyRepository $reproducaoSpotifyRepository,
        private SpotifyInterface $spotifyClient,
        private ObterTokenValidoSpotifyService $obterTokenValidoSpotifyService,
        private EnriquecerImagensSpotifyService $enriquecerImagensService,
        private LoggerInterface $logger,
    ) {
    }

    public function executarParaConta(ContaSpotify $conta): ResultadoColetaHistoricoSpotifyDTO
    {
        if (!$conta->isConectada()) {
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
                $cursorAtual,
                self::LIMITE_PADRAO_COLETA,
            );
        } catch (SpotifyException $e) {
            $this->logger->warning('Erro retornado pela API do Spotify durante a coleta do histórico.', [
                'conta' => $conta->uuid()->toRfc4122(),
                'usuario' => $conta->usuario()->getId(),
                'codigo' => $e->getCode(),
                'erro' => $e->getMessage(),
            ]);

            return new ResultadoColetaHistoricoSpotifyDTO(0, 0, 0, $cursorAtual);
        }

        if (empty($lista->itens)) {
            $conta->registrarColeta();
            $this->contaSpotifyRepository->salvar($conta);

            return new ResultadoColetaHistoricoSpotifyDTO(0, 0, 0, $cursorAtual);
        }

        /** @var array<int, string> $chavesPorItem */
        $chavesPorItem = [];
        foreach ($lista->itens as $indice => $item) {
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

        foreach ($lista->itens as $indice => $item) {
            $chave = $chavesPorItem[$indice];
            $timestampItemMs = (int) ($item->tocadoEm->getTimestamp() * 1000);

            if (null === $maiorTimestampMs || $timestampItemMs > $maiorTimestampMs) {
                $maiorTimestampMs = $timestampItemMs;
            }

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
                msReproduzidos: $item->duracaoMs,
                tocadaEm: $item->tocadoEm,
                fonte: FonteReproducaoSpotify::Api,
            );

            $this->reproducaoSpotifyRepository->salvar($reproducao, false);
            ++$totalNovas;

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
