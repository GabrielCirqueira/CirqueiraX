<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Enum\RenovacaoCacheAnalise;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\Cache\TagAwareCacheInterface;

final readonly class CacheAnaliseSpotifyService
{
    private const int VALIDADE_SEGUNDOS = 1209600;
    private const int VALIDADE_MARCA_SEGUNDOS = 86400;
    private const int IDADE_MINIMA_RECALCULO_SEGUNDOS = 90;
    private const int IDADE_MAXIMA_SEM_RECALCULO_SEGUNDOS = 21600;
    private const string PREFIXO = 'spotify_analise';
    private const string PREFIXO_MARCA = 'spotify_analise_marca';
    private const string VERSAO_FORMATO = 'v8';
    private const string CAMPO_CALCULADO_EM = 'calculadoEm';
    private const string CAMPO_VALOR = 'valor';

    public function __construct(
        private TagAwareCacheInterface $cache,
        private FilaRecalculoAnaliseService $fila,
        #[Autowire('%app.versao_codigo_analise%')]
        private string $versaoCodigo,
    ) {
    }

    /**
     * @template T
     *
     * @param callable(): T $calcular
     *
     * @return T
     */
    public function lembrar(
        Usuario $usuario,
        string $chave,
        callable $calcular,
        ?FiltroFonteMusica $fonte = null,
        RenovacaoCacheAnalise $renovacao = RenovacaoCacheAnalise::Diaria,
    ): mixed {
        $chave = null === $fonte ? $chave : $chave.'|'.$fonte->value;
        $chaveCompleta = sprintf(
            '%s_%d_%s',
            self::PREFIXO,
            (int) $usuario->getId(),
            md5(implode('|', [
                self::VERSAO_FORMATO,
                $this->versaoCodigo,
                $renovacao->sufixoChave(PeriodoAnaliseSpotifyDTO::agoraLocal()),
                $chave,
            ])),
        );

        $entrada = $this->obterEntrada($usuario, $chaveCompleta, $calcular, 0.0);

        if ($this->estaDesatualizada($usuario, $entrada[self::CAMPO_CALCULADO_EM])) {
            $this->fila->agendar($chaveCompleta, function () use ($usuario, $chaveCompleta, $calcular): void {
                $this->obterEntrada($usuario, $chaveCompleta, $calcular, INF);
            });
        }

        return $entrada[self::CAMPO_VALOR];
    }

    public function registrarNovasReproducoes(Usuario $usuario): void
    {
        $agora = time();
        $this->cache->get($this->chaveMarca($usuario), static function (ItemInterface $item) use ($agora): int {
            $item->expiresAfter(self::VALIDADE_MARCA_SEGUNDOS);

            return $agora;
        }, INF);
    }

    public function invalidar(Usuario $usuario): void
    {
        $this->cache->invalidateTags([$this->tag($usuario)]);
    }

    /**
     * @template T
     *
     * @param callable(): T $calcular
     *
     * @return array{calculadoEm: int, valor: T}
     */
    private function obterEntrada(Usuario $usuario, string $chaveCompleta, callable $calcular, float $beta): array
    {
        return $this->cache->get($chaveCompleta, function (ItemInterface $item) use ($usuario, $calcular): array {
            $item->expiresAfter(self::VALIDADE_SEGUNDOS);
            $item->tag($this->tag($usuario));
            $calculadoEm = time();

            return [self::CAMPO_CALCULADO_EM => $calculadoEm, self::CAMPO_VALOR => $calcular()];
        }, $beta);
    }

    private function estaDesatualizada(Usuario $usuario, int $calculadoEm): bool
    {
        $idade = time() - $calculadoEm;
        if ($idade < self::IDADE_MINIMA_RECALCULO_SEGUNDOS) {
            return false;
        }

        if ($idade > self::IDADE_MAXIMA_SEM_RECALCULO_SEGUNDOS) {
            return true;
        }

        $marca = $this->cache->get($this->chaveMarca($usuario), static fn (): int => 0);

        return $marca > $calculadoEm;
    }

    private function chaveMarca(Usuario $usuario): string
    {
        return sprintf('%s_%d', self::PREFIXO_MARCA, (int) $usuario->getId());
    }

    private function tag(Usuario $usuario): string
    {
        return sprintf('%s_%d', self::PREFIXO, (int) $usuario->getId());
    }
}
