<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\Entity\ContaSpotify;
use App\Entity\Usuario;
use App\Exception\Spotify\SpotifyException;
use App\Interface\CriptografiaInterface;
use App\Interface\SpotifyInterface;
use App\Message\SincronizarHistoricoSpotifyMessage;
use App\Repository\ContaSpotifyRepository;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class ConcluirAutorizacaoSpotifyService
{
    private const string PREFIXO_CACHE_STATE = 'spotify_state_';

    public function __construct(
        private SpotifyInterface $spotifyClient,
        private CriptografiaInterface $criptografia,
        private ContaSpotifyRepository $contaSpotifyRepository,
        private CacheItemPoolInterface $cache,
        private MessageBusInterface $messageBus,
    ) {
    }

    public function executar(Usuario $usuario, string $code, string $state): ContaSpotify
    {
        $this->validarState($usuario, $state);

        $tokens = $this->spotifyClient->trocarCodigoPorTokens($code);
        $perfil = $this->spotifyClient->buscarPerfil($tokens->accessToken);

        $this->validarConflitoConta($usuario, $perfil->id);

        $conta = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
        if (null === $conta) {
            $conta = new ContaSpotify($usuario);
        }

        $accessTokenCripto = $this->criptografia->criptografar($tokens->accessToken);
        $refreshTokenCripto = null !== $tokens->refreshToken
            ? $this->criptografia->criptografar($tokens->refreshToken)
            : ($conta->refreshTokenCriptografado() ?? '');

        $conta->conectar(
            $perfil->id,
            $perfil->nomeExibicao,
            $perfil->urlFoto,
            $accessTokenCripto,
            $refreshTokenCripto,
            $tokens->expiraEmSegundos,
            $tokens->escopos,
        );

        $this->contaSpotifyRepository->salvar($conta);
        $this->messageBus->dispatch(new SincronizarHistoricoSpotifyMessage($conta->uuid()->toRfc4122()));

        return $conta;
    }

    private function validarState(Usuario $usuario, string $state): void
    {
        $chaveCache = self::PREFIXO_CACHE_STATE.$state;
        $item = $this->cache->getItem($chaveCache);

        if (!$item->isHit()) {
            throw SpotifyException::stateInvalidoOuExpirado();
        }

        $valorGuardado = $item->get();
        $usuarioIdGuardado = is_string($valorGuardado) ? $valorGuardado : (is_scalar($valorGuardado) ? (string) $valorGuardado : '');
        $this->cache->deleteItem($chaveCache);

        if ($usuarioIdGuardado !== (string) $usuario->getId()) {
            throw SpotifyException::stateInvalidoOuExpirado();
        }
    }

    private function validarConflitoConta(Usuario $usuario, string $spotifyId): void
    {
        $outraConta = $this->contaSpotifyRepository->buscarPorSpotifyId($spotifyId);
        if (null !== $outraConta && $outraConta->usuario()->getId() !== $usuario->getId()) {
            throw SpotifyException::contaJaVinculadaOutroUsuario();
        }

        $contaUsuario = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
        if (null !== $contaUsuario && '' !== $contaUsuario->spotifyId() && $contaUsuario->spotifyId() !== $spotifyId) {
            throw SpotifyException::contaJaVinculadaOutroUsuario();
        }
    }
}
