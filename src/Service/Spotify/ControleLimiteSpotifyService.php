<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\Entity\BloqueioSpotify;
use App\Enum\OrigemConsultaSpotify;
use App\Repository\BloqueioSpotifyRepository;
use App\Repository\ConsultaSpotifyHoraRepository;
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
    private const string PREFIXO_CONSULTAS_POR_MINUTO = 'spotify_limite_minutos_';
    private const int SEGUNDOS_POR_MINUTO = 60;
    private const int MINUTOS_JANELA_RECENTE = 60;
    private const int VALIDADE_JANELA_RECENTE_SEGUNDOS = 7200;

    public function __construct(
        private CacheItemPoolInterface $cache,
        private BloqueioSpotifyRepository $bloqueioRepository,
        private ConsultaSpotifyHoraRepository $consultaHoraRepository,
        private LoggerInterface $logger,
    ) {
    }

    public function registrarConsulta(OrigemConsultaSpotify $origem): void
    {
        $this->consultaHoraRepository->incrementar($origem, new \DateTimeImmutable());
        $this->somarNaJanelaRecente($origem);
    }

    /**
     * Consultas da origem nos últimos 60 minutos (janela móvel, minuto a minuto), para regular o ritmo de quem consulta com frequência.
     */
    public function consultasNaUltimaHora(OrigemConsultaSpotify $origem): int
    {
        return array_sum($this->minutosRecentes($origem));
    }

    public function estaBloqueado(): bool
    {
        return null !== $this->buscarBloqueioAtivo();
    }

    public function buscarBloqueioAtivo(): ?BloqueioSpotify
    {
        $ultimo = $this->bloqueioRepository->buscarUltimo();
        if (null === $ultimo || !$ultimo->isAtivo(new \DateTimeImmutable())) {
            return null;
        }

        return $ultimo;
    }

    public function podeBuscarArtistas(): bool
    {
        $ultimo = $this->bloqueioRepository->buscarUltimo();
        if (null !== $ultimo && $ultimo->isAtivo(new \DateTimeImmutable())) {
            return false;
        }

        if (!$this->isUltimaColetaBemSucedida($ultimo)) {
            return false;
        }

        return $this->consultasArtistasUltimas24h() < self::LIMITE_CONSULTAS_ARTISTAS_EM_24H;
    }

    public function consultasArtistasUltimas24h(): int
    {
        return $this->consultaHoraRepository->somarDaOrigemDesde(OrigemConsultaSpotify::Artistas, (new \DateTimeImmutable())->modify(self::JANELA_MEDICAO));
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
        $agora = new \DateTimeImmutable();
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

    private function somarNaJanelaRecente(OrigemConsultaSpotify $origem): void
    {
        $minutos = $this->minutosRecentes($origem);
        $minutoAtual = intdiv(time(), self::SEGUNDOS_POR_MINUTO);
        $minutos[$minutoAtual] = ($minutos[$minutoAtual] ?? 0) + 1;

        $item = $this->cache->getItem(self::PREFIXO_CONSULTAS_POR_MINUTO.$origem->value);
        $item->set($minutos);
        $item->expiresAfter(self::VALIDADE_JANELA_RECENTE_SEGUNDOS);
        $this->cache->save($item);
    }

    /**
     * @return array<int, int>
     */
    private function minutosRecentes(OrigemConsultaSpotify $origem): array
    {
        $item = $this->cache->getItem(self::PREFIXO_CONSULTAS_POR_MINUTO.$origem->value);
        $minutos = $item->isHit() && is_array($item->get()) ? $item->get() : [];
        $inicioJanela = intdiv(time(), self::SEGUNDOS_POR_MINUTO) - self::MINUTOS_JANELA_RECENTE;

        return array_filter(
            array_map('intval', $minutos),
            static fn (int $minuto): bool => $minuto > $inicioJanela,
            ARRAY_FILTER_USE_KEY,
        );
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
