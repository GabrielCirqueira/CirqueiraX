<?php

declare(strict_types=1);

namespace App\Service\TransferenciaPlaylist;

use App\Entity\ItemTransferenciaPlaylist;
use App\Entity\ItemVinculoPlaylist;
use App\Entity\PlaylistTransferenciaSelecionada;
use App\Entity\TransferenciaPlaylist;
use App\Entity\Usuario;
use App\Entity\VinculoPlaylist;
use App\Enum\ModoSincronizacaoPlaylist;
use App\Enum\ServicoPlaylist;
use App\Exception\TransferenciaPlaylist\TransferenciaPlaylistException;
use App\Exception\YoutubeOAuth\YoutubeOAuthException;
use App\Interface\SpotifyInterface;
use App\Interface\YoutubePlaylistInterface;
use App\Message\ExecutarTransferenciaPlaylistMessage;
use App\Repository\ContaSpotifyRepository;
use App\Repository\ContaYoutubeOAuthRepository;
use App\Repository\ItemTransferenciaPlaylistRepository;
use App\Repository\TransferenciaPlaylistRepository;
use App\Repository\VinculoPlaylistRepository;
use App\Service\Spotify\ObterTokenValidoSpotifyService;
use App\Service\YoutubeOAuth\ObterTokenValidoYoutubeOAuthService;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class ExecutarTransferenciaPlaylistService
{
    private const int LOTE_SPOTIFY = 100;
    private const int ESPERA_YOUTUBE_MICROSEGUNDOS = 200000;
    private const string PREFIXO_URI_FAIXA = 'spotify:track:';

    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ContaYoutubeOAuthRepository $contaYoutubeOAuthRepository,
        private ItemTransferenciaPlaylistRepository $itemRepository,
        private MessageBusInterface $messageBus,
        private ObterTokenValidoSpotifyService $obterTokenSpotify,
        private ObterTokenValidoYoutubeOAuthService $obterTokenYoutube,
        private SpotifyInterface $spotify,
        private TransferenciaPlaylistRepository $transferenciaRepository,
        private VinculoPlaylistRepository $vinculoRepository,
        private YoutubePlaylistInterface $youtubePlaylist,
    ) {
    }

    public function enfileirar(Usuario $usuario, string $transferenciaUuid): TransferenciaPlaylist
    {
        $transferencia = $this->transferenciaRepository->buscarDoUsuarioPorUuid($usuario, $transferenciaUuid);
        if (null === $transferencia) {
            throw TransferenciaPlaylistException::transferenciaNaoEncontrada();
        }

        if (!$transferencia->isPrevia() && !$transferencia->isPausadaCota()) {
            throw TransferenciaPlaylistException::transferenciaNaoPodeExecutar();
        }

        $transferencia->iniciarExecucao();
        $this->transferenciaRepository->salvar($transferencia);
        $this->messageBus->dispatch(new ExecutarTransferenciaPlaylistMessage($transferencia->uuid()->toRfc4122()));

        return $transferencia;
    }

    public function executar(string $transferenciaUuid): void
    {
        $transferencia = $this->transferenciaRepository->buscarPorUuid($transferenciaUuid);
        if (null === $transferencia) {
            throw TransferenciaPlaylistException::transferenciaNaoEncontrada();
        }

        if (!$transferencia->status()->isExecutando() && !$transferencia->isPausadaCota()) {
            return;
        }

        if ($transferencia->isPausadaCota()) {
            $transferencia->iniciarExecucao();
        }

        try {
            $this->processarPlaylists($transferencia);
        } catch (YoutubeOAuthException $erro) {
            if (429 === $erro->getCode()) {
                $transferencia->pausarPorCota($erro->getMessage());
                $this->transferenciaRepository->salvar($transferencia);

                return;
            }

            $transferencia->falhar($erro->getMessage());
            $this->transferenciaRepository->salvar($transferencia);

            return;
        }

        $contagem = $this->itemRepository->contarPorStatus($transferencia);
        $transferencia->atualizarContadores(
            $contagem['total'],
            $contagem['casadas'],
            $contagem['duvidosas'],
            $contagem['naoEncontradas'],
            $contagem['transferidas'],
            $contagem['falhas'],
        );
        $transferencia->concluir();
        $this->transferenciaRepository->salvar($transferencia);
    }

    private function processarPlaylists(TransferenciaPlaylist $transferencia): void
    {
        $tokenSpotify = $this->obterTokenSeNecessario($transferencia, ServicoPlaylist::Spotify);
        $tokenYoutube = $this->obterTokenSeNecessario($transferencia, ServicoPlaylist::Youtube);

        foreach ($transferencia->playlistsSelecionadas() as $playlist) {
            $this->processarPlaylist($transferencia, $playlist, $tokenSpotify, $tokenYoutube);
        }
    }

    private function processarPlaylist(
        TransferenciaPlaylist $transferencia,
        PlaylistTransferenciaSelecionada $playlist,
        ?string $tokenSpotify,
        ?string $tokenYoutube,
    ): void {
        $itens = array_values(array_filter(
            $this->itemRepository->listarDaTransferencia($transferencia),
            static fn (ItemTransferenciaPlaylist $item): bool => $item->playlistSelecionada()?->uuid()->equals($playlist->uuid()) ?? false,
        ));

        $itensProntos = array_values(array_filter(
            $itens,
            static fn (ItemTransferenciaPlaylist $item): bool => $item->status()->isProntaParaTransferir() && null !== $item->idExternoDestino(),
        ));

        if ($playlist->decisao()->isSoVincular()) {
            $this->criarVinculo($transferencia, $playlist, $itensProntos);

            return;
        }

        $idDestino = $this->resolverPlaylistDestino($transferencia, $playlist, $tokenSpotify, $tokenYoutube);
        $playlist->definirDestinoFinal($idDestino);

        if ($transferencia->destino()->isSpotify()) {
            $this->transferirParaSpotify($tokenSpotify ?? '', $idDestino, $itensProntos);
        }

        if ($transferencia->destino()->isYoutube()) {
            $this->transferirParaYoutube($tokenYoutube ?? '', $idDestino, $itensProntos);
        }

        $this->criarVinculo($transferencia, $playlist, $itensProntos);
        $this->transferenciaRepository->salvar($transferencia, false);
    }

    private function resolverPlaylistDestino(
        TransferenciaPlaylist $transferencia,
        PlaylistTransferenciaSelecionada $playlist,
        ?string $tokenSpotify,
        ?string $tokenYoutube,
    ): string {
        if (!$playlist->decisao()->isCriarNova()) {
            $existente = $playlist->idExternoDestinoExistente();
            if (null !== $existente && '' !== trim($existente)) {
                return $existente;
            }
        }

        if ($transferencia->destino()->isSpotify()) {
            $criada = $this->spotify->criarPlaylist($tokenSpotify ?? '', $playlist->nomeOrigem());

            return $criada->id;
        }

        $criada = $this->youtubePlaylist->criarPlaylist($tokenYoutube ?? '', $playlist->nomeOrigem());

        return $criada->id;
    }

    /**
     * @param list<ItemTransferenciaPlaylist> $itens
     */
    private function transferirParaSpotify(string $token, string $playlistId, array $itens): void
    {
        $uris = [];
        foreach ($itens as $item) {
            $id = $item->idExternoDestino();
            if (null === $id || '' === $id) {
                continue;
            }
            $uris[] = self::PREFIXO_URI_FAIXA.$id;
        }

        foreach (array_chunk($uris, self::LOTE_SPOTIFY) as $lote) {
            $this->spotify->adicionarItensPlaylist($token, $playlistId, $lote);
        }

        foreach ($itens as $item) {
            $item->marcarTransferida();
            $this->itemRepository->salvar($item, false);
        }
        $this->itemRepository->flush();
    }

    /**
     * @param list<ItemTransferenciaPlaylist> $itens
     */
    private function transferirParaYoutube(string $token, string $playlistId, array $itens): void
    {
        foreach ($itens as $item) {
            $videoId = $item->idExternoDestino();
            if (null === $videoId || '' === $videoId) {
                continue;
            }

            try {
                $this->youtubePlaylist->adicionarItemPlaylist($token, $playlistId, $videoId);
                $item->marcarTransferida();
            } catch (YoutubeOAuthException $erro) {
                if (429 === $erro->getCode()) {
                    throw $erro;
                }
                $item->marcarFalha();
            }

            $this->itemRepository->salvar($item, false);
            usleep(self::ESPERA_YOUTUBE_MICROSEGUNDOS);
        }
        $this->itemRepository->flush();
    }

    /**
     * @param list<ItemTransferenciaPlaylist> $itens
     */
    private function criarVinculo(
        TransferenciaPlaylist $transferencia,
        PlaylistTransferenciaSelecionada $playlist,
        array $itens,
    ): void {
        $idSpotify = $transferencia->origem()->isSpotify()
            ? $playlist->idExternoOrigem()
            : ($playlist->idExternoDestinoFinal() ?? $playlist->idExternoDestinoExistente() ?? '');
        $idYoutube = $transferencia->origem()->isYoutube()
            ? $playlist->idExternoOrigem()
            : ($playlist->idExternoDestinoFinal() ?? $playlist->idExternoDestinoExistente() ?? '');

        if ('' === $idSpotify || '' === $idYoutube) {
            return;
        }

        $modo = $transferencia->origem()->isSpotify()
            ? ModoSincronizacaoPlaylist::SpotifyParaYoutube
            : ModoSincronizacaoPlaylist::YoutubeParaSpotify;

        $nomeSpotify = $transferencia->origem()->isSpotify() ? $playlist->nomeOrigem() : ($playlist->nomeDestinoExistente() ?? $playlist->nomeOrigem());
        $nomeYoutube = $transferencia->origem()->isYoutube() ? $playlist->nomeOrigem() : ($playlist->nomeDestinoExistente() ?? $playlist->nomeOrigem());

        $vinculo = $this->vinculoRepository->buscarPorIds($transferencia->usuario(), $idSpotify, $idYoutube);
        if (null === $vinculo) {
            $vinculo = new VinculoPlaylist(
                $transferencia->usuario(),
                $idSpotify,
                $nomeSpotify,
                $idYoutube,
                $nomeYoutube,
                $modo,
                $playlist->snapshotIdOrigem(),
            );
        }

        $estado = [];
        foreach ($itens as $item) {
            $estado[] = [
                'origem' => $item->idExternoOrigem(),
                'destino' => $item->idExternoDestino(),
            ];

            $idFaixaSpotify = $transferencia->origem()->isSpotify() ? $item->idExternoOrigem() : $item->idExternoDestino();
            $idVideoYoutube = $transferencia->origem()->isYoutube() ? $item->idExternoOrigem() : $item->idExternoDestino();

            new ItemVinculoPlaylist(
                $vinculo,
                $idFaixaSpotify,
                $idVideoYoutube,
                null,
                $item->musicaCatalogo(),
            );
        }

        $vinculo->registrarSincronizacao((string) json_encode($estado, JSON_THROW_ON_ERROR));
        $this->vinculoRepository->salvar($vinculo);
    }

    private function obterTokenSeNecessario(TransferenciaPlaylist $transferencia, ServicoPlaylist $servico): ?string
    {
        if ($transferencia->origem() !== $servico && $transferencia->destino() !== $servico) {
            return null;
        }

        if ($servico->isSpotify()) {
            $conta = $this->contaSpotifyRepository->buscarDoUsuario($transferencia->usuario());
            if (null === $conta) {
                throw TransferenciaPlaylistException::contaSpotifyNecessaria();
            }

            return $this->obterTokenSpotify->executar($conta);
        }

        $conta = $this->contaYoutubeOAuthRepository->buscarDoUsuario($transferencia->usuario());
        if (null === $conta) {
            throw TransferenciaPlaylistException::contaYoutubeOAuthNecessaria();
        }

        return $this->obterTokenYoutube->executar($conta);
    }
}
