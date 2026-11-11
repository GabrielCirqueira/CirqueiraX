<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\Entity\ContaSpotify;
use App\Enum\OrigemConsultaSpotify;
use App\Exception\Spotify\SpotifyException;
use App\Interface\CriptografiaInterface;
use App\Interface\SpotifyInterface;
use App\Repository\ContaSpotifyRepository;

final readonly class ObterTokenValidoSpotifyService
{
    public function __construct(
        private SpotifyInterface $spotifyClient,
        private CriptografiaInterface $criptografia,
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ControleLimiteSpotifyService $controleLimite,
    ) {
    }

    public function executar(ContaSpotify $conta): string
    {
        if ($conta->isDesconectada()) {
            throw SpotifyException::contaNaoConectada();
        }

        if ($conta->isReconectar()) {
            throw SpotifyException::contaRequerReconexao($conta->erroMotivo() ?? 'Acesso revogado ou expirado.');
        }

        if (!$conta->isTokenExpirado() && null !== $conta->accessTokenCriptografado()) {
            return $this->criptografia->descriptografar($conta->accessTokenCriptografado());
        }

        return $this->renovarComLock($conta);
    }

    private function renovarComLock(ContaSpotify $conta): string
    {
        $caminhoLock = sys_get_temp_dir().'/cirqueirax_spotify_token_'.$conta->uuid()->toRfc4122().'.lock';
        $arquivoLock = @fopen($caminhoLock, 'c+');

        if (false === $arquivoLock) {
            throw SpotifyException::falhaAoObterLockRenovacao();
        }

        @flock($arquivoLock, LOCK_EX);

        try {
            $contaAtualizada = $this->contaSpotifyRepository->buscarDoUsuario($conta->usuario());
            if (null !== $contaAtualizada && !$contaAtualizada->isTokenExpirado() && null !== $contaAtualizada->accessTokenCriptografado()) {
                return $this->criptografia->descriptografar($contaAtualizada->accessTokenCriptografado());
            }

            $refreshTokenCripto = $conta->refreshTokenCriptografado();
            if (null === $refreshTokenCripto || '' === trim($refreshTokenCripto)) {
                $conta->marcarComoReconectar('Token de atualização não encontrado.');
                $this->contaSpotifyRepository->salvar($conta);
                throw SpotifyException::contaRequerReconexao('Token de atualização não encontrado.');
            }

            $refreshToken = $this->criptografia->descriptografar($refreshTokenCripto);

            $this->controleLimite->registrarConsulta(OrigemConsultaSpotify::Autorizacao);

            try {
                $novosTokens = $this->spotifyClient->renovarToken($refreshToken);
            } catch (SpotifyException $e) {
                $conta->marcarComoReconectar($e->getMessage());
                $this->contaSpotifyRepository->salvar($conta);
                throw $e;
            } catch (\Throwable $e) {
                $conta->marcarComoReconectar($e->getMessage());
                $this->contaSpotifyRepository->salvar($conta);
                throw SpotifyException::falhaNaRenovacaoDeToken();
            }

            $novoAccessCripto = $this->criptografia->criptografar($novosTokens->accessToken);
            $novoRefreshCripto = null !== $novosTokens->refreshToken
                ? $this->criptografia->criptografar($novosTokens->refreshToken)
                : null;

            $conta->renovarTokens(
                $novoAccessCripto,
                $novoRefreshCripto,
                $novosTokens->expiraEmSegundos,
            );

            $this->contaSpotifyRepository->salvar($conta);

            return $novosTokens->accessToken;
        } finally {
            @flock($arquivoLock, LOCK_UN);
            @fclose($arquivoLock);
        }
    }
}
