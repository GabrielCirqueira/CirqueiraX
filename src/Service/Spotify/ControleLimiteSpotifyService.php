<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\Entity\BloqueioSpotify;
use App\Enum\OrigemConsultaSpotify;
use App\Repository\BloqueioSpotifyRepository;
use App\Repository\ConsultaSpotifyHoraRepository;
use DateTimeImmutable;
use Psr\Cache\CacheItemPoolInterface;
use Psr\Log\LoggerInterface;

final readonly class ControleLimiteSpotifyService
{
    public const int LIMITE_CONSULTAS_ARTISTAS_EM_24H = 300;
    private const int FOLGA_SEGUNDOS = 60;
    private const int ESPERA_MINIMA_SEGUNDOS = 900;
    private const int VALIDADE_MARCADORES_SEGUNDOS = 2592000;
    private const string JANELA_MEDICAO = '-24 hours';
    private const string CHAVE_ULTIMA_COLETA = 'spotify_limite_ultima_coleta';
    private const string CHAVE_ULTIMA_FALHA_COLETA = 'spotify_limite_ultima_falha_coleta';

    public function __construct(
        private CacheItemPoolInterface $cache,
        private BloqueioSpotifyRepository $bloqueioRepository,
        private ConsultaSpotifyHoraRepository $consultaHoraRepository,
        private LoggerInterface $logger,
    ) {
    }

    public function registrarConsulta(OrigemConsultaSpotify $origem): void
    {
        $this->consultaHoraRepository->incrementar($origem, new DateTimeImmutable());
    }

    public function estaBloqueado(): bool
    {
        return null !== $this->buscarBloqueioAtivo();
    }

    public function buscarBloqueioAtivo(): ?BloqueioSpotify
    {
        $ultimo = $this->bloqueioRepository->buscarUltimo();
        if (null === $ultimo || !$ultimo->isAtivo(new DateTimeImmutable())) {
            return null;
        }

        return $ultimo;
    }

    public function podeBuscarArtistas(): bool
    {
        $ultimo = $this->bloqueioRepository->buscarUltimo();
        if (null !== $ultimo && $ultimo->isAtivo(new DateTimeImmutable())) {
            return false;
        }

        if (!$this->isUltimaColetaBemSucedida($ultimo)) {
            return false;
        }

        return $this->consultasArtistasUltimas24h() < self::LIMITE_CONSULTAS_ARTISTAS_EM_24H;
    }

    public function consultasArtistasUltimas24h(): int
    {
        return $this->consultaHoraRepository->somarDaOrigemDesde(OrigemConsultaSpotify::Artistas, (new DateTimeImmutable())->modify(self::JANELA_MEDICAO));
    }

    public function registrarColetaConcluida(): void
    {
        $this->gravarInteiro(self::CHAVE_ULTIMA_COLETA, time());
    }

    public function registrarColetaFalhou(): void
    {
        $this->gravarInteiro(self::CHAVE_ULTIMA_FALHA_COLETA, time());
    }

    public function registrarBloqueio(int $segundosEspera, OrigemConsultaSpotify $origem, int $intervaloEntreConsultasSegundos): void
    {
        $agora = new DateTimeImmutable();
        $anterior = $this->bloqueioRepository->buscarUltimo();
        $inicioContagem = $anterior?->ocorridoEm() ?? $agora->modify(self::JANELA_MEDICAO);
        $consultasArtistas = $this->consultaHoraRepository->somarDaOrigemDesde(OrigemConsultaSpotify::Artistas, $inicioContagem);
        $consultasPorOrigem = $this->consultaHoraRepository->somarPorOrigemDesde($agora->modify(self::JANELA_MEDICAO));
        $espera = max(self::ESPERA_MINIMA_SEGUNDOS, $segundosEspera + self::FOLGA_SEGUNDOS);

        $this->bloqueioRepository->salvar(new BloqueioSpotify(
            $segundosEspera,
            $espera,
            $origem,
            $consultasArtistas,
            $intervaloEntreConsultasSegundos,
            $consultasPorOrigem,
        ));
        $this->logger->warning('Spotify bloqueou as consultas do app (429).', [
            'origem' => $origem->value,
            'retryAfterSegundos' => $segundosEspera,
            'consultasArtistasDesdeUltimoBloqueio' => $consultasArtistas,
            'consultasPorOrigemUltimas24h' => $consultasPorOrigem,
            'intervaloEntreConsultasSegundos' => $intervaloEntreConsultasSegundos,
        ]);
    }

    private function isUltimaColetaBemSucedida(?BloqueioSpotify $ultimoBloqueio): bool
    {
        $ultimaColeta = $this->lerInteiro(self::CHAVE_ULTIMA_COLETA);
        if (0 === $ultimaColeta || $ultimaColeta < $this->lerInteiro(self::CHAVE_ULTIMA_FALHA_COLETA)) {
            return false;
        }

        $inicioLiberado = null === $ultimoBloqueio ? 0 : $ultimoBloqueio->liberadoEm()->getTimestamp();

        return $ultimaColeta >= $inicioLiberado;
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
