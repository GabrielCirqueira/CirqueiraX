<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\Entity\Usuario;
use App\Enum\FonteReproducaoYoutube;
use App\Repository\ReproducaoYoutubeRepository;
use App\Service\Musica\Projecao\ProjetarReproducoesYoutubeService;
use DateTimeImmutable;

final readonly class AtualizarReproducaoEmAndamentoYoutubeService
{
    private const int MILISSEGUNDOS_POR_SEGUNDO = 1000;
    private const int LIMITE_SEM_DURACAO_MS = 600000;
    private const string MARGEM_BUSCA = '+1 second';

    public function __construct(
        private ReproducaoYoutubeRepository $reproducaoRepository,
        private ProjetarReproducoesYoutubeService $projetarYoutube,
    ) {
    }

    /**
     * @param list<string> $idsAtuais
     */
    public function executar(Usuario $usuario, array $idsAtuais, DateTimeImmutable $vistoEm): void
    {
        $videoNoTopo = $idsAtuais[0] ?? null;
        $ultima = $this->reproducaoRepository->buscarUltimaAntesDe($usuario, $vistoEm->modify(self::MARGEM_BUSCA));
        if (null === $videoNoTopo || null === $ultima || FonteReproducaoYoutube::Coletor !== $ultima->fonte() || $ultima->video()->videoId() !== $videoNoTopo) {
            return;
        }

        $decorridoMs = ($vistoEm->getTimestamp() - $ultima->tocadaEm()->getTimestamp()) * self::MILISSEGUNDOS_POR_SEGUNDO;
        $estimadoMs = max(0, min($decorridoMs, $ultima->video()->duracaoMs() ?? self::LIMITE_SEM_DURACAO_MS));
        if ($estimadoMs <= $ultima->msReproduzidos()) {
            return;
        }

        $ultima->ajustarMsReproduzidos($estimadoMs);
        $this->reproducaoRepository->salvar($ultima);
        $this->projetarYoutube->projetarVideos($usuario, [$ultima->video()]);
    }
}
