<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\DataObject\Pronuncia\TocandoAgoraPronunciaDTO;
use App\Entity\Usuario;
use App\Enum\OrigemConsultaSpotify;
use App\Repository\ContaSpotifyRepository;
use App\Service\Spotify\ControleLimiteSpotifyService;
use App\Service\Spotify\ObterTocandoAgoraSpotifyService;

final readonly class ObterTocandoAgoraPronunciaService
{
    private const int INTERVALO_RAPIDO_MS = 5000;
    private const int INTERVALO_ECONOMICO_MS = 15000;
    private const int LIMITE_CONSULTAS_RAPIDAS_POR_HORA = 360;
    private const int LIMITE_CONSULTAS_APP_EM_24H = 900;

    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ObterTocandoAgoraSpotifyService $obterTocandoAgoraService,
        private ControleLimiteSpotifyService $controleLimite,
    ) {
    }

    public function executar(Usuario $usuario): TocandoAgoraPronunciaDTO
    {
        $conta = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
        $conectado = null !== $conta && $conta->isConectada();

        return new TocandoAgoraPronunciaDTO($conectado, $this->obterTocandoAgoraService->executar($usuario), $this->proximaConsultaMs());
    }

    /**
     * Ritmo de 5 s para pegar a troca de música rápido, só enquanto houver folga: menos de 360 consultas do "tocando agora" na última hora e menos de 900 consultas do app inteiro em 24 h (o bloqueio de 26/11 veio com ~1.366). Sem folga, 15 s.
     */
    private function proximaConsultaMs(): int
    {
        $folgaNaHora = $this->controleLimite->consultasNaUltimaHora(OrigemConsultaSpotify::TocandoAgora) < self::LIMITE_CONSULTAS_RAPIDAS_POR_HORA;
        $temFolga = $folgaNaHora && $this->controleLimite->consultasTotaisUltimas24h() < self::LIMITE_CONSULTAS_APP_EM_24H;

        return $temFolga ? self::INTERVALO_RAPIDO_MS : self::INTERVALO_ECONOMICO_MS;
    }
}
