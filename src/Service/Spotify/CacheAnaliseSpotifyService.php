<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\Cache\TagAwareCacheInterface;

final readonly class CacheAnaliseSpotifyService
{
    private const int VALIDADE_SEGUNDOS = 21600;
    private const string PREFIXO = 'spotify_analise';
    private const string VERSAO_FORMATO = 'v6';

    public function __construct(
        private TagAwareCacheInterface $cache,
    ) {
    }

    /**
     * @template T
     *
     * @param callable(): T $calcular
     *
     * @return T
     */
    public function lembrar(Usuario $usuario, string $chave, callable $calcular, ?FiltroFonteMusica $fonte = null): mixed
    {
        $chave = null === $fonte ? $chave : $chave.'|'.$fonte->value;
        $chaveCompleta = sprintf(
            '%s_%d_%s',
            self::PREFIXO,
            (int) $usuario->getId(),
            md5(self::VERSAO_FORMATO.'|'.PeriodoAnaliseSpotifyDTO::agoraLocal()->format('Y-m-d').'|'.$chave),
        );

        return $this->cache->get($chaveCompleta, function (ItemInterface $item) use ($usuario, $calcular): mixed {
            $item->expiresAfter(self::VALIDADE_SEGUNDOS);
            $item->tag($this->tag($usuario));

            return $calcular();
        });
    }

    public function invalidar(Usuario $usuario): void
    {
        $this->cache->invalidateTags([$this->tag($usuario)]);
    }

    private function tag(Usuario $usuario): string
    {
        return sprintf('%s_%d', self::PREFIXO, (int) $usuario->getId());
    }
}
