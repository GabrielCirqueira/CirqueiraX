<?php

declare(strict_types=1);

namespace App\Service\Dashboard;

use App\Entity\ContaSpotify;
use App\Entity\ContaYoutubeMusic;
use App\Entity\Usuario;
use App\Repository\ContaSpotifyRepository;
use App\Repository\ContaYoutubeMusicRepository;
use App\Repository\ReproducaoYoutubeRepository;
use App\Serializer\ContaSpotifySerializer;
use App\Service\Spotify\ControleLimiteSpotifyService;
use DateTimeImmutable;
use DateTimeInterface;

final readonly class ResumoIntegracoesMusicaService
{
    public const int LIMITE_ALERTA_COLETA_PARADA_SEGUNDOS = 10800;
    private const string ROTA_MUSICA = '/musica';
    private const string ESTADO_NAO_CONFIGURADO = 'nao_configurado';
    private const string ESTADO_CONECTADO = 'conectado';
    private const string ESTADO_RECONECTAR = 'reconectar';

    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ContaYoutubeMusicRepository $contaYoutubeMusicRepository,
        private ReproducaoYoutubeRepository $reproducaoYoutubeRepository,
        private ControleLimiteSpotifyService $controleLimiteSpotify,
        private ContaSpotifySerializer $contaSpotifySerializer,
    ) {
    }

    /**
     * @return array{spotify: array<string, mixed>, youtubeMusic: array<string, mixed>}
     */
    public function executar(Usuario $usuario): array
    {
        return [
            'spotify' => $this->resumoSpotify($this->contaSpotifyRepository->buscarDoUsuario($usuario)),
            'youtubeMusic' => $this->resumoYoutubeMusic($usuario, $this->contaYoutubeMusicRepository->buscarDoUsuario($usuario)),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function resumoSpotify(?ContaSpotify $conta): array
    {
        $conectada = null !== $conta && $conta->isConectada();
        $bloqueio = $conectada ? $this->controleLimiteSpotify->buscarBloqueioAtivo() : null;

        return [
            'conectado' => $conectada,
            'status' => $conta?->status()->value ?? 'desconectada',
            'nomeExibicao' => $conta?->nomeExibicao(),
            'conectadoEm' => $conta?->conectadoEm()?->format(DateTimeInterface::ATOM),
            'ultimaColetaEm' => $conta?->ultimaColetaEm()?->format(DateTimeInterface::ATOM),
            'coletaParada' => $conectada && $this->isColetaSpotifyParada($conta),
            'motivoErro' => $conta?->erroMotivo(),
            ...$this->contaSpotifySerializer->serializarBloqueio($bloqueio),
        ];
    }

    private function isColetaSpotifyParada(ContaSpotify $conta): bool
    {
        $referencia = $conta->ultimaColetaEm() ?? $conta->conectadoEm();
        if (null === $referencia) {
            return false;
        }

        return (new DateTimeImmutable())->getTimestamp() - $referencia->getTimestamp() > self::LIMITE_ALERTA_COLETA_PARADA_SEGUNDOS;
    }

    /**
     * @return array<string, mixed>
     */
    private function resumoYoutubeMusic(Usuario $usuario, ?ContaYoutubeMusic $conta): array
    {
        return [
            'estado' => $this->estadoYoutubeMusic($conta),
            'nomeConta' => $conta?->nomeConta(),
            'ultimaConsultaEm' => $conta?->ultimaConsultaEm()?->format(DateTimeInterface::ATOM),
            'ultimaNovidadeEm' => $conta?->ultimaNovidadeEm()?->format(DateTimeInterface::ATOM),
            'motivoErro' => $conta?->erroMotivo(),
            'totalReproducoesColetadas' => $this->reproducaoYoutubeRepository->contarDoUsuario($usuario),
            'rota' => self::ROTA_MUSICA,
        ];
    }

    private function estadoYoutubeMusic(?ContaYoutubeMusic $conta): string
    {
        if (null === $conta || $conta->isDesconectada()) {
            return self::ESTADO_NAO_CONFIGURADO;
        }

        if ($conta->isReconectar()) {
            return self::ESTADO_RECONECTAR;
        }

        return self::ESTADO_CONECTADO;
    }
}
