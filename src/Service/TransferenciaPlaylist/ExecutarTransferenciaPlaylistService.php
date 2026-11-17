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
use App\Repository\PlaylistTransferenciaSelecionadaRepository;
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
        private PlaylistTransferenciaSelecionadaRepository $playlistSelecionadaRepository,
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

        foreach ($this->playlistSelecionadaRepository->listarDaTransferencia($transferencia) as $playlist) {
            $this->processarPlaylist($transferencia, $playlist, $tokenSpotify, $tokenYoutube);
        }
    }

    private function processarPlaylist(
        TransferenciaPlaylist $transferencia,
        PlaylistTransferenciaSelecionada $playlist,
        ?string $tokenSpotify,
        ?string $tokenYoutube,
    ): void {
        $itensProntos = $this->itemRepository->listarProntosParaTransferirDaPlaylist($transferencia, $playlist);

        if ($playlist->decisao()->isSoVincular()) {
            $this->criarVinculo($transferencia, $playlist, $itensProntos);
            foreach ($itensProntos as $item) {
                $item->marcarTransferida();
                $this->itemRepository->salvar($item, false);
            }
            $this->itemRepository->flush();
            $playlist->avancarProgressoFaixas(count($itensProntos));
            $this->persistirProgresso($transferencia);

            return;
        }

        $idDestino = $this->resolverPlaylistDestino($transferencia, $playlist, $tokenSpotify, $tokenYoutube);
        $playlist->definirDestinoFinal($idDestino);

        if ($transferencia->destino()->isSpotify()) {
            $this->transferirParaSpotify($transferencia, $playlist, $tokenSpotify ?? '', $idDestino, $itensProntos);
        }

        if ($transferencia->destino()->isYoutube()) {
            $this->transferirParaYoutube($transferencia, $playlist, $tokenYoutube ?? '', $idDestino, $itensProntos);
        }

        $this->criarVinculo($transferencia, $playlist, $itensProntos);
        $this->persistirProgresso($transferencia);
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
    private function transferirParaSpotify(
        TransferenciaPlaylist $transferencia,
        PlaylistTransferenciaSelecionada $playlist,
        string $token,
        string $playlistId,
        array $itens,
    ): void {
        foreach (array_chunk($itens, self::LOTE_SPOTIFY) as $loteItens) {
            $uris = [];
            foreach ($loteItens as $item) {
                $id = $item->idExternoDestino();
                if (null === $id || '' === $id) {
                    continue;
                }
                $uris[] = self::PREFIXO_URI_FAIXA.$id;
            }

            if ([] !== $uris) {
                $this->spotify->adicionarItensPlaylist($token, $playlistId, $uris);
            }

            foreach ($loteItens as $item) {
                $item->marcarTransferida();
                $this->itemRepository->salvar($item, false);
            }
            $this->itemRepository->flush();
            $playlist->avancarProgressoFaixas(count($loteItens));
            $this->persistirProgresso($transferencia);
        }
    }

    /**
     * @param list<ItemTransferenciaPlaylist> $itens
     */
    private function transferirParaYoutube(
        TransferenciaPlaylist $transferencia,
        PlaylistTransferenciaSelecionada $playlist,
        string $token,
        string $playlistId,
        array $itens,
    ): void {
        $processadosDesdeFlush = 0;

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
                    $this->itemRepository->flush();
                    $this->persistirProgresso($transferencia);
                    throw $erro;
                }
                $item->marcarFalha();
            }

            $this->itemRepository->salvar($item, false);
            $playlist->avancarProgressoFaixas(1);
            ++$processadosDesdeFlush;

            if ($processadosDesdeFlush >= 5) {
                $this->itemRepository->flush();
                $this->persistirProgresso($transferencia);
                $processadosDesdeFlush = 0;
            }

            usleep(self::ESPERA_YOUTUBE_MICROSEGUNDOS);
        }

        if ($processadosDesdeFlush > 0) {
            $this->itemRepository->flush();
            $this->persistirProgresso($transferencia);
        }
    }

    private function persistirProgresso(TransferenciaPlaylist $transferencia): void
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
        $this->transferenciaRepository->salvar($transferencia);
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
