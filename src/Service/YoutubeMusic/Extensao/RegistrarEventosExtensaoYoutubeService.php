<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Extensao;

use App\DataObject\YoutubeMusic\EventoExtensaoYoutubeDTO;
use App\DataObject\YoutubeMusic\LoteEventosExtensaoYoutubeDTO;
use App\Entity\ReproducaoYoutube;
use App\Entity\TokenExtensaoYoutubeMusic;
use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Enum\FonteReproducaoYoutube;
use App\Exception\YoutubeMusic\ExtensaoYoutubeMusicException;
use App\Message\IdentificarVideosYoutubeMessage;
use App\Repository\ReproducaoYoutubeRepository;
use App\Repository\TokenExtensaoYoutubeMusicRepository;
use App\Repository\VideoYoutubeRepository;
use App\Service\Musica\Projecao\ProjetarReproducoesYoutubeService;
use DateTimeImmutable;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;

final readonly class RegistrarEventosExtensaoYoutubeService
{
    private const string FORMATO_SEGUNDOS_ATRAS = '-%d seconds';
    private const string FORMATO_MILISSEGUNDOS_ATRAS = '-%d milliseconds';
    private const string JANELA_ENCERRAR_SEM_FIM = '-1 day';
    private const int TOLERANCIA_INICIO_MS = 60000;
    private const int MILISSEGUNDOS_POR_SEGUNDO = 1000;

    public function __construct(
        private ReproducaoYoutubeRepository $reproducaoRepository,
        private VideoYoutubeRepository $videoRepository,
        private TokenExtensaoYoutubeMusicRepository $tokenRepository,
        private UnirReproducaoExtensaoComColetaService $unirComColeta,
        private ProjetarReproducoesYoutubeService $projetarYoutube,
        private RateLimiterFactoryInterface $youtubeMusicExtensaoLimiter,
        private MessageBusInterface $messageBus,
    ) {
    }

    public function executar(TokenExtensaoYoutubeMusic $token, LoteEventosExtensaoYoutubeDTO $lote): int
    {
        if (!$this->youtubeMusicExtensaoLimiter->create($token->uuid()->toRfc4122())->consume()->isAccepted()) {
            throw ExtensaoYoutubeMusicException::muitosEventos();
        }

        $usuario = $token->usuario();
        if (!$usuario->fonteCapturaYoutubeMusic()->isExtensao()) {
            return 0;
        }

        $recebidoEm = new DateTimeImmutable();
        $registradas = [];
        $videos = [];
        $novaPendente = false;
        foreach ($lote->eventos as $evento) {
            $jaExistia = isset($registradas[$evento->idReproducao]) || null !== $this->reproducaoRepository->buscarDaExtensao($usuario, $evento->idReproducao);
            $registradas[$evento->idReproducao] = $this->registrar($usuario, $evento, $recebidoEm, $registradas[$evento->idReproducao] ?? null, $videos);
            $novaPendente = $novaPendente || (!$jaExistia && $registradas[$evento->idReproducao]->video()->isPendente());
        }

        if ($token->isUsoParaRegistrar($recebidoEm)) {
            $this->tokenRepository->salvar($token->registrarUso($recebidoEm), flush: false);
        }

        $this->reproducaoRepository->flush();
        $this->projetarYoutube->projetarVideos($usuario, array_values(array_map(static fn (ReproducaoYoutube $reproducao): VideoYoutube => $reproducao->video(), $registradas)));

        if ($novaPendente) {
            $this->messageBus->dispatch(new IdentificarVideosYoutubeMessage());
        }

        return count($lote->eventos);
    }

    /**
     * @param array<string, VideoYoutube> $videos
     */
    private function registrar(Usuario $usuario, EventoExtensaoYoutubeDTO $evento, DateTimeImmutable $recebidoEm, ?ReproducaoYoutube $doLote, array &$videos): ReproducaoYoutube
    {
        $existente = $doLote ?? $this->reproducaoRepository->buscarDaExtensao($usuario, $evento->idReproducao);
        if (null !== $existente) {
            $existente->video()->corrigirDuracaoInformadaPeloPlayer($evento->duracaoMs);

            return $existente
                ->atualizarProgressoDaExtensao($evento->msOuvidos, $evento->puladaInformada(), $evento->isPausada())
                ->registrarPosicaoDaExtensao($evento->posicaoMs, $this->momentoDaAmostra($evento, $recebidoEm));
        }

        $video = $videos[$evento->videoId] ?? $this->obterVideo($usuario, $evento);
        $videos[$evento->videoId] = $video;
        $inicio = $recebidoEm->modify(sprintf(self::FORMATO_SEGUNDOS_ATRAS, $this->segundosDesdeInicio($evento, $video)));
        $this->encerrarAnterioresSemFim($usuario, $inicio);
        $estimada = $this->unirComColeta->buscarEstimadaParaExtensao($usuario, $video, $inicio);
        $reproducao = $estimada?->marcarVistaPeloColetor() ?? new ReproducaoYoutube($usuario, $video, $inicio, 0, FonteReproducaoYoutube::Extensao);
        $reproducao
            ->assumirDadosDaExtensao($evento->idReproducao, $inicio, $evento->msOuvidos, $evento->puladaInformada(), $evento->isPausada())
            ->registrarPosicaoDaExtensao($evento->posicaoMs, $this->momentoDaAmostra($evento, $recebidoEm));
        $this->reproducaoRepository->salvar($reproducao, flush: false);

        return $reproducao;
    }

    private function momentoDaAmostra(EventoExtensaoYoutubeDTO $evento, DateTimeImmutable $recebidoEm): ?DateTimeImmutable
    {
        if (null === $evento->msDesdeAmostra) {
            return null;
        }

        return $recebidoEm->modify(sprintf(self::FORMATO_MILISSEGUNDOS_ATRAS, $evento->msDesdeAmostra));
    }

    private function segundosDesdeInicio(EventoExtensaoYoutubeDTO $evento, VideoYoutube $video): int
    {
        $duracaoMs = $video->duracaoMs();
        $informadoMs = $evento->segundosDesdeInicio * self::MILISSEGUNDOS_POR_SEGUNDO;
        if (null === $duracaoMs || $informadoMs <= max($duracaoMs, $evento->msOuvidos) + self::TOLERANCIA_INICIO_MS) {
            return $evento->segundosDesdeInicio;
        }

        return intdiv($evento->msOuvidos, self::MILISSEGUNDOS_POR_SEGUNDO);
    }

    private function encerrarAnterioresSemFim(Usuario $usuario, DateTimeImmutable $inicio): void
    {
        $abertas = $this->reproducaoRepository->listarDaExtensaoSemFimAntesDe($usuario, $inicio, $inicio->modify(self::JANELA_ENCERRAR_SEM_FIM));
        foreach ($abertas as $aberta) {
            $this->reproducaoRepository->salvar($aberta->encerrarSemFimDaExtensao(), flush: false);
        }
    }

    private function obterVideo(Usuario $usuario, EventoExtensaoYoutubeDTO $evento): VideoYoutube
    {
        $video = $this->videoRepository->buscarPorVideoIds($usuario, [$evento->videoId])[$evento->videoId]
            ?? new VideoYoutube($usuario, $evento->videoId, $evento->titulo, $evento->canal);
        $video->atualizarDadosColetados($video->titulo(), $video->canal(), $video->duracaoMs() ?? $evento->duracaoMs, $video->urlCapa() ?? $evento->urlCapa);
        $video->corrigirDuracaoInformadaPeloPlayer($evento->duracaoMs);
        $this->videoRepository->salvar($video, flush: false);

        return $video;
    }
}
