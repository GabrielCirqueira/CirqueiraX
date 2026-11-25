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
    private const int INTERVALO_ECONOMICO_MS = 12000;
    private const int LIMITE_CONSULTAS_RAPIDAS_POR_HORA = 360;

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
     * Ritmo de 5 s para pegar a troca de música rápido; passa para 12 s quando o "tocando agora" já fez 360 consultas na última hora (média de 6 por minuto), abaixo do ritmo que já causou bloqueio do Spotify.
     */
    private function proximaConsultaMs(): int
    {
        $consultas = $this->controleLimite->consultasNaUltimaHora(OrigemConsultaSpotify::TocandoAgora);

        return $consultas < self::LIMITE_CONSULTAS_RAPIDAS_POR_HORA ? self::INTERVALO_RAPIDO_MS : self::INTERVALO_ECONOMICO_MS;
    }
}
