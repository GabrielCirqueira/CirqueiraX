<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\Entity\ContaSpotify;
use App\Entity\Usuario;
use App\Exception\Spotify\SpotifyException;
use App\Interface\SpotifyInterface;
use App\Repository\ContaSpotifyRepository;
use App\Repository\ReproducaoSpotifyRepository;

final readonly class PlayerTesteSpotifyService
{
    private const array ESCOPOS_REPRODUCAO = [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-read-playback-state',
        'user-modify-playback-state',
    ];

    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ObterTokenValidoSpotifyService $obterTokenValidoService,
        private ReproducaoSpotifyRepository $reproducaoRepository,
        private SpotifyInterface $spotifyClient,
    ) {
    }

    /**
     * @return array{accessToken: string, permissaoReproducao: bool, escoposFaltando: list<string>}
     */
    public function obterToken(Usuario $usuario): array
    {
        $conta = $this->obterConta($usuario);
        $escoposConcedidos = preg_split('/\s+/', trim((string) $conta->escopos())) ?: [];
        $faltando = array_values(array_diff(self::ESCOPOS_REPRODUCAO, $escoposConcedidos));

        return [
            'accessToken' => $this->obterTokenValidoService->executar($conta),
            'permissaoReproducao' => [] === $faltando,
            'escoposFaltando' => $faltando,
        ];
    }

    /**
     * @return array{nomeFaixa: string, artista: string}
     */
    public function tocarMusicaTeste(Usuario $usuario, string $codigoDispositivo): array
    {
        if ('' === $codigoDispositivo) {
            throw SpotifyException::dispositivoNaoInformado();
        }

        $conta = $this->obterConta($usuario);
        $ultima = $this->reproducaoRepository->buscarUltimaReproducao($usuario);
        if (null === $ultima || null === $ultima->codigoFaixa()) {
            throw SpotifyException::semMusicaParaTestar();
        }

        $this->spotifyClient->tocarNoDispositivo(
            $this->obterTokenValidoService->executar($conta),
            $codigoDispositivo,
            ['spotify:track:'.$ultima->codigoFaixa()],
        );

        return ['nomeFaixa' => $ultima->nomeFaixa(), 'artista' => $ultima->artistaPrincipal()];
    }

    private function obterConta(Usuario $usuario): ContaSpotify
    {
        $conta = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
        if (null === $conta || !$conta->isConectada()) {
            throw SpotifyException::contaNaoConectada();
        }

        return $conta;
    }
}
