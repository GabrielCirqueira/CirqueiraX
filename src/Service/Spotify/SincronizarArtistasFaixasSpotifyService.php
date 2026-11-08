<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\FaixaSpotifyDTO;
use App\Entity\ContaSpotify;
use App\Exception\Spotify\SpotifyException;
use App\Interface\SpotifyInterface;
use App\Repository\ArtistaFaixaSpotifyRepository;
use App\Repository\ContaSpotifyRepository;
use Psr\Log\LoggerInterface;

final readonly class SincronizarArtistasFaixasSpotifyService
{
    public const int LIMITE_PADRAO = 40;
    private const int CODIGO_RESPOSTA_INESPERADA = 500;

    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ArtistaFaixaSpotifyRepository $artistaFaixaRepository,
        private ObterTokenValidoSpotifyService $obterTokenValidoService,
        private SpotifyInterface $spotifyClient,
        private CacheAnaliseSpotifyService $cacheAnalise,
        private LoggerInterface $logger,
    ) {
    }

    public function executarParaTodasContasConectadas(int $limite = self::LIMITE_PADRAO): int
    {
        $total = 0;
        foreach ($this->contaSpotifyRepository->listarConectadas() as $conta) {
            $total += $this->executarParaConta($conta, $limite);
        }

        return $total;
    }

    public function executarParaConta(ContaSpotify $conta, int $limite = self::LIMITE_PADRAO): int
    {
        if (!$conta->isConectada()) {
            return 0;
        }

        $faixas = $this->artistaFaixaRepository->listarFaixasSemArtistas($conta->usuario(), $limite);
        if ([] === $faixas) {
            return 0;
        }

        try {
            $token = $this->obterTokenValidoService->executar($conta);
        } catch (SpotifyException $excecao) {
            $this->logger->warning('Sem token válido para buscar os artistas das músicas do Spotify.', ['erro' => $excecao->getMessage()]);

            return 0;
        }

        $processadas = 0;
        foreach ($faixas as $faixa) {
            $artistas = $this->buscarArtistas($token, $faixa['codigo_faixa'], $faixa['artista'], $faixa['codigo_artista']);
            if (null === $artistas) {
                break;
            }

            $this->artistaFaixaRepository->registrarArtistasDaFaixa($faixa['codigo_faixa'], $artistas);
            ++$processadas;
        }

        if ($processadas > 0) {
            $this->cacheAnalise->invalidar($conta->usuario());
        }

        return $processadas;
    }

    /**
     * @return list<array{nome: string, codigo: ?string}>|null
     */
    private function buscarArtistas(string $token, string $codigoFaixa, string $artistaPrincipal, ?string $codigoArtistaPrincipal): ?array
    {
        try {
            return self::artistasDaFaixa($this->spotifyClient->obterFaixa($token, $codigoFaixa));
        } catch (SpotifyException $excecao) {
            if (self::CODIGO_RESPOSTA_INESPERADA !== $excecao->getCode()) {
                $this->logger->info('Busca dos artistas das músicas do Spotify pausada.', ['erro' => $excecao->getMessage()]);

                return null;
            }

            return [['nome' => $artistaPrincipal, 'codigo' => $codigoArtistaPrincipal]];
        }
    }

    /**
     * @return list<array{nome: string, codigo: ?string}>
     */
    public static function artistasDaFaixa(FaixaSpotifyDTO $faixa): array
    {
        return [
            ['nome' => $faixa->artistaPrincipal, 'codigo' => $faixa->codigoArtistaPrincipal],
            ...array_map(static fn (string $nome): array => ['nome' => $nome, 'codigo' => null], array_values($faixa->demaisArtistas)),
        ];
    }
}
