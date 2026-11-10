<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\Entity\BloqueioSpotify;
use App\Repository\BloqueioSpotifyRepository;
use DateTimeImmutable;
use Psr\Cache\CacheItemPoolInterface;
use Psr\Log\LoggerInterface;

final readonly class ControleLimiteSpotifyService
{
    public const string ORIGEM_COLETA = 'coleta_historico';
    public const string ORIGEM_ARTISTAS = 'busca_artistas';
    private const int FOLGA_SEGUNDOS = 60;
    private const int ESPERA_MINIMA_SEGUNDOS = 900;
    private const int VALIDADE_MARCADORES_SEGUNDOS = 2592000;
    private const string CHAVE_ULTIMA_COLETA = 'spotify_limite_ultima_coleta';
    private const string CHAVE_CONSULTAS_ARTISTAS = 'spotify_limite_consultas_artistas';

    public function __construct(
        private CacheItemPoolInterface $cache,
        private BloqueioSpotifyRepository $bloqueioRepository,
        private LoggerInterface $logger,
    ) {
    }

    public function estaBloqueado(): bool
    {
        $ultimo = $this->bloqueioRepository->buscarUltimo();

        return null !== $ultimo && $ultimo->liberadoEm() > new DateTimeImmutable();
    }

    public function podeBuscarArtistas(): bool
    {
        $ultimo = $this->bloqueioRepository->buscarUltimo();
        if (null !== $ultimo && $ultimo->liberadoEm() > new DateTimeImmutable()) {
            return false;
        }

        $inicioLiberado = null === $ultimo ? 0 : $ultimo->liberadoEm()->getTimestamp();

        return $this->lerInteiro(self::CHAVE_ULTIMA_COLETA) >= $inicioLiberado && $this->lerInteiro(self::CHAVE_ULTIMA_COLETA) > 0;
    }

    public function registrarColetaConcluida(): void
    {
        $this->gravarInteiro(self::CHAVE_ULTIMA_COLETA, time());
    }

    public function registrarConsultaArtistas(): void
    {
        $this->gravarInteiro(self::CHAVE_CONSULTAS_ARTISTAS, $this->lerInteiro(self::CHAVE_CONSULTAS_ARTISTAS) + 1);
    }

    public function registrarBloqueio(int $segundosEspera, string $origem, int $intervaloEntreConsultasSegundos): void
    {
        $consultas = $this->lerInteiro(self::CHAVE_CONSULTAS_ARTISTAS);
        $espera = max(self::ESPERA_MINIMA_SEGUNDOS, $segundosEspera + self::FOLGA_SEGUNDOS);

        $this->gravarInteiro(self::CHAVE_CONSULTAS_ARTISTAS, 0);
        $this->bloqueioRepository->salvar(new BloqueioSpotify($segundosEspera, $espera, $origem, $consultas, $intervaloEntreConsultasSegundos));
        $this->logger->warning('Spotify bloqueou as consultas do app (429).', [
            'origem' => $origem,
            'retryAfterSegundos' => $segundosEspera,
            'consultasArtistasDesdeUltimoBloqueio' => $consultas,
            'intervaloEntreConsultasSegundos' => $intervaloEntreConsultasSegundos,
        ]);
    }

    private function lerInteiro(string $chave): int
    {
        $item = $this->cache->getItem($chave);

        return $item->isHit() ? (int) $item->get() : 0;
    }

    private function gravarInteiro(string $chave, int $valor): void
    {
        $item = $this->cache->getItem($chave);
        $item->set($valor);
        $item->expiresAfter(self::VALIDADE_MARCADORES_SEGUNDOS);
        $this->cache->save($item);
    }
}
