<?php

declare(strict_types=1);

namespace App\Service\TransferenciaPlaylist;

use App\DataObject\IdentificacaoMusica\ComponenteIdentificadoDTO;
use App\DataObject\Spotify\FaixaSpotifyDTO;
use App\Entity\ArtistaCatalogo;
use App\Entity\ItemTransferenciaPlaylist;
use App\Entity\MusicaCatalogo;
use App\Entity\TransferenciaPlaylist;
use App\Exception\Spotify\SpotifyException;
use App\Exception\TransferenciaPlaylist\TransferenciaPlaylistException;
use App\Exception\YoutubeMusic\YoutubeMusicException;
use App\Interface\SpotifyInterface;
use App\Message\CasarFaixasTransferenciaMessage;
use App\Repository\ContaSpotifyRepository;
use App\Repository\ItemTransferenciaPlaylistRepository;
use App\Repository\MusicaCatalogoRepository;
use App\Repository\TransferenciaPlaylistRepository;
use App\Repository\VinculoMusicaSpotifyRepository;
use App\Service\IdentificacaoMusica\ConfirmarMusicaYoutubeService;
use App\Service\Musica\NormalizarTextoMusicaService;
use App\Service\Spotify\ObterTokenValidoSpotifyService;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class CasarFaixasTransferenciaService
{
    private const int LIMIAR_CASADA = 70;
    private const int LIMIAR_DUVIDOSA = 40;
    private const int LOTE_ITENS = 25;
    private const int PONTUACAO_CATALOGO = 100;
    private const int LIMITE_BUSCA_SPOTIFY = 5;

    public function __construct(
        private ConfirmarMusicaYoutubeService $confirmarMusicaYoutube,
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ItemTransferenciaPlaylistRepository $itemRepository,
        private MessageBusInterface $messageBus,
        private MusicaCatalogoRepository $musicaCatalogoRepository,
        private NormalizarTextoMusicaService $normalizador,
        private ObterTokenValidoSpotifyService $obterTokenSpotify,
        private SpotifyInterface $spotify,
        private TransferenciaPlaylistRepository $transferenciaRepository,
        private VinculoMusicaSpotifyRepository $vinculoMusicaSpotifyRepository,
    ) {
    }

    public function executar(string $transferenciaUuid): void
    {
        $transferencia = $this->transferenciaRepository->buscarPorUuid($transferenciaUuid);
        if (null === $transferencia) {
            throw TransferenciaPlaylistException::transferenciaNaoEncontrada();
        }

        if (!$transferencia->isCasando()) {
            return;
        }

        $pendentes = $this->itemRepository->listarPendentes($transferencia, self::LOTE_ITENS);
        if ([] === $pendentes) {
            $this->finalizarCasamento($transferencia);

            return;
        }

        foreach ($pendentes as $item) {
            $this->casarItem($transferencia, $item);
            $this->itemRepository->salvar($item, false);
        }

        $this->atualizarContadores($transferencia);
        $this->transferenciaRepository->salvar($transferencia);

        $aindaPendentes = $this->itemRepository->listarPendentes($transferencia, 1);
        if ([] === $aindaPendentes) {
            $this->finalizarCasamento($transferencia);

            return;
        }

        $this->messageBus->dispatch(new CasarFaixasTransferenciaMessage($transferencia->uuid()->toRfc4122()));
    }

    private function casarItem(TransferenciaPlaylist $transferencia, ItemTransferenciaPlaylist $item): void
    {
        if ($transferencia->origem()->isSpotify() && $transferencia->destino()->isYoutube()) {
            $this->casarSpotifyParaYoutube($item);

            return;
        }

        $this->casarYoutubeParaSpotify($transferencia, $item);
    }

    private function casarSpotifyParaYoutube(ItemTransferenciaPlaylist $item): void
    {
        $artistaPrincipal = $this->normalizador->separarArtistas($item->artistasOrigem())[0] ?? '';
        $nomeNormalizado = $this->normalizador->normalizarTitulo($item->tituloOrigem());
        $artistaNormalizado = $this->normalizador->normalizar($artistaPrincipal);
        $vinculo = $this->vinculoMusicaSpotifyRepository->buscarPorIdentidade($nomeNormalizado, $artistaNormalizado);

        if (null !== $vinculo) {
            $musica = $vinculo->musica()->musicaEfetiva();
            $videoId = $musica->videoOficialId();
            if (null !== $videoId && '' !== trim($videoId)) {
                $item->marcarCasada(
                    $videoId,
                    $musica->titulo(),
                    $this->nomesArtistasCatalogo($musica),
                    self::PONTUACAO_CATALOGO,
                    $musica,
                );

                return;
            }
        }

        $artistas = $this->normalizador->separarArtistas($item->artistasOrigem());
        if ([] === $artistas) {
            $item->marcarNaoEncontrada();

            return;
        }

        try {
            $confirmado = $this->confirmarMusicaYoutube->executar(
                new ComponenteIdentificadoDTO($item->tituloOrigem(), $artistas),
                $item->duracaoMsOrigem(),
            );
        } catch (YoutubeMusicException) {
            $item->marcarNaoEncontrada();

            return;
        }

        if (null === $confirmado) {
            $item->marcarNaoEncontrada();

            return;
        }

        $item->marcarCasada(
            $confirmado->videoId,
            $confirmado->titulo,
            $confirmado->textoArtistas,
            self::LIMIAR_CASADA,
            $vinculo?->musica()->musicaEfetiva(),
        );
    }

    private function casarYoutubeParaSpotify(TransferenciaPlaylist $transferencia, ItemTransferenciaPlaylist $item): void
    {
        $musica = $this->musicaCatalogoRepository->buscarPorVideoOficialId($item->idExternoOrigem());
        $conta = $this->contaSpotifyRepository->buscarDoUsuario($transferencia->usuario());
        if (null === $conta) {
            throw TransferenciaPlaylistException::contaSpotifyNecessaria();
        }

        $token = $this->obterTokenSpotify->executar($conta);
        $tituloBusca = $musica?->titulo() ?? $item->tituloOrigem();
        $artistasBusca = null !== $musica
            ? $this->nomesArtistasCatalogo($musica)
            : $item->artistasOrigem();
        $textoBusca = trim($tituloBusca.' '.$artistasBusca);

        try {
            $busca = $this->spotify->buscarFaixas($token, $textoBusca, self::LIMITE_BUSCA_SPOTIFY);
        } catch (SpotifyException) {
            $item->marcarNaoEncontrada();

            return;
        }

        if ([] === $busca->faixas) {
            $item->marcarNaoEncontrada();

            return;
        }

        $melhor = $this->escolherMelhorFaixaSpotify($busca->faixas, $tituloBusca, $artistasBusca, $item->duracaoMsOrigem());
        if (null === $melhor) {
            $item->marcarNaoEncontrada();

            return;
        }

        [$faixa, $pontuacao] = $melhor;
        $artistasDestino = trim($faixa->artistaPrincipal.([] === $faixa->demaisArtistas ? '' : ', '.implode(', ', $faixa->demaisArtistas)));

        if ($pontuacao >= self::LIMIAR_CASADA) {
            $item->marcarCasada($faixa->codigoFaixa, $faixa->nome, $artistasDestino, $pontuacao, $musica);

            return;
        }

        if ($pontuacao >= self::LIMIAR_DUVIDOSA) {
            $item->marcarDuvidosa($faixa->codigoFaixa, $faixa->nome, $artistasDestino, $pontuacao, $musica);

            return;
        }

        $item->marcarNaoEncontrada();
    }

    /**
     * @param list<FaixaSpotifyDTO> $faixas
     *
     * @return array{0: FaixaSpotifyDTO, 1: int}|null
     */
    private function escolherMelhorFaixaSpotify(array $faixas, string $titulo, string $artistas, ?int $duracaoMs): ?array
    {
        $tituloEsperado = $this->normalizador->normalizarTitulo($titulo);
        $artistaEsperado = $this->normalizador->normalizar($this->normalizador->separarArtistas($artistas)[0] ?? '');
        $melhor = null;
        $melhorPontuacao = 0;

        foreach ($faixas as $faixa) {
            $pontuacao = 0;
            $tituloFaixa = $this->normalizador->normalizarTitulo($faixa->nome);
            $artistaFaixa = $this->normalizador->normalizar($faixa->artistaPrincipal);

            if ('' !== $tituloEsperado && ($tituloEsperado === $tituloFaixa || str_contains($tituloFaixa, $tituloEsperado) || str_contains($tituloEsperado, $tituloFaixa))) {
                $pontuacao += 40;
            }

            if ('' !== $artistaEsperado && ($artistaEsperado === $artistaFaixa || str_contains($artistaFaixa, $artistaEsperado) || str_contains($artistaEsperado, $artistaFaixa))) {
                $pontuacao += 40;
            }

            if (null !== $duracaoMs && $duracaoMs > 0 && $faixa->duracaoMs > 0) {
                $diferenca = abs($faixa->duracaoMs - $duracaoMs);
                if ($diferenca <= 15000) {
                    $pontuacao += 20;
                } elseif ($diferenca <= 30000) {
                    $pontuacao += 10;
                }
            } else {
                $pontuacao += 10;
            }

            if ($pontuacao > $melhorPontuacao) {
                $melhor = $faixa;
                $melhorPontuacao = $pontuacao;
            }
        }

        if (null === $melhor) {
            return null;
        }

        return [$melhor, $melhorPontuacao];
    }

    private function nomesArtistasCatalogo(MusicaCatalogo $musica): string
    {
        return implode(', ', array_map(
            static fn (ArtistaCatalogo $artista): string => $artista->nome(),
            $musica->artistas(),
        ));
    }

    private function atualizarContadores(TransferenciaPlaylist $transferencia): void
    {
        $contagem = $this->itemRepository->contarPorStatus($transferencia);
        $transferencia->atualizarContadores(
            $contagem['total'],
            $contagem['casadas'],
            $contagem['duvidosas'],
            $contagem['naoEncontradas'],
            $contagem['transferidas'],
            $contagem['falhas'],
        );
    }

    private function finalizarCasamento(TransferenciaPlaylist $transferencia): void
    {
        $this->atualizarContadores($transferencia);
        $transferencia->marcarPrevia();
        $this->transferenciaRepository->salvar($transferencia);
    }
}
