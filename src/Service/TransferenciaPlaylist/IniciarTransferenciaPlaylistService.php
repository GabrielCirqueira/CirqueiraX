<?php

declare(strict_types=1);

namespace App\Service\TransferenciaPlaylist;

use App\DataObject\TransferenciaPlaylist\IniciarTransferenciaPlaylistDTO;
use App\DataObject\TransferenciaPlaylist\PlaylistResumoDTO;
use App\DataObject\TransferenciaPlaylist\PlaylistSelecionadaEntradaDTO;
use App\Entity\ItemTransferenciaPlaylist;
use App\Entity\PlaylistTransferenciaSelecionada;
use App\Entity\TransferenciaPlaylist;
use App\Entity\Usuario;
use App\Enum\DecisaoPlaylistDestino;
use App\Enum\ServicoPlaylist;
use App\Exception\TransferenciaPlaylist\TransferenciaPlaylistException;
use App\Message\CasarFaixasTransferenciaMessage;
use App\Repository\ContaSpotifyRepository;
use App\Repository\ContaYoutubeOAuthRepository;
use App\Repository\TransferenciaPlaylistRepository;
use App\Service\Spotify\ObterTokenValidoSpotifyService;
use App\Service\YoutubeOAuth\ObterTokenValidoYoutubeOAuthService;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class IniciarTransferenciaPlaylistService
{
    public function __construct(
        private CarregarFaixasPlaylistService $carregarFaixas,
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ContaYoutubeOAuthRepository $contaYoutubeOAuthRepository,
        private ListarPlaylistsServicoService $listarPlaylists,
        private MessageBusInterface $messageBus,
        private ObterTokenValidoSpotifyService $obterTokenSpotify,
        private ObterTokenValidoYoutubeOAuthService $obterTokenYoutube,
        private TransferenciaPlaylistRepository $transferenciaRepository,
    ) {
    }

    public function executar(Usuario $usuario, IniciarTransferenciaPlaylistDTO $dto): TransferenciaPlaylist
    {
        $origem = ServicoPlaylist::tryFrom($dto->origem);
        $destino = ServicoPlaylist::tryFrom($dto->destino);
        if (null === $origem) {
            throw TransferenciaPlaylistException::servicoOrigemInvalido();
        }
        if (null === $destino) {
            throw TransferenciaPlaylistException::servicoDestinoInvalido();
        }
        if ($origem === $destino) {
            throw TransferenciaPlaylistException::origemEDestinoIguais();
        }
        $playlistsEntrada = $dto->playlistsNormalizadas();
        if ([] === $playlistsEntrada) {
            throw TransferenciaPlaylistException::nenhumaPlaylistSelecionada();
        }

        $this->garantirContas($usuario, $origem, $destino);

        $playlistsOrigem = $this->listarPlaylists->executar($usuario, $origem);
        $mapaOrigem = [];
        foreach ($playlistsOrigem->itens as $playlist) {
            $mapaOrigem[$playlist->id] = $playlist;
        }

        $tokenOrigem = $this->obterTokenOrigem($usuario, $origem);
        $transferencia = new TransferenciaPlaylist($usuario, $origem, $destino);
        $transferencia->iniciarCasamento();
        $ordem = 0;

        foreach ($playlistsEntrada as $entrada) {
            $ordem = $this->adicionarPlaylist(
                $transferencia,
                $entrada,
                $mapaOrigem,
                $origem,
                $tokenOrigem,
                $ordem,
            );
        }

        $this->transferenciaRepository->salvar($transferencia);
        $this->messageBus->dispatch(new CasarFaixasTransferenciaMessage($transferencia->uuid()->toRfc4122()));

        return $transferencia;
    }

    /**
     * @param array<string, PlaylistResumoDTO> $mapaOrigem
     */
    private function adicionarPlaylist(
        TransferenciaPlaylist $transferencia,
        PlaylistSelecionadaEntradaDTO $entrada,
        array $mapaOrigem,
        ServicoPlaylist $origem,
        string $tokenOrigem,
        int $ordem,
    ): int {
        $resumo = $mapaOrigem[$entrada->idExterno] ?? null;
        if (null === $resumo) {
            throw TransferenciaPlaylistException::playlistOrigemNaoEncontrada($entrada->idExterno);
        }

        $decisao = DecisaoPlaylistDestino::CriarNova;
        if (null !== $entrada->decisao && '' !== trim($entrada->decisao)) {
            $decisao = DecisaoPlaylistDestino::tryFrom($entrada->decisao) ?? throw TransferenciaPlaylistException::decisaoDestinoInvalida();
        }

        $selecionada = new PlaylistTransferenciaSelecionada(
            transferencia: $transferencia,
            idExternoOrigem: $resumo->id,
            nomeOrigem: $resumo->nome,
            totalFaixasOrigem: $resumo->totalFaixas,
            urlCapaOrigem: $resumo->urlCapa,
            snapshotIdOrigem: $resumo->snapshotId,
            idExternoDestinoExistente: $entrada->idDestinoExistente,
            nomeDestinoExistente: null,
            decisao: $decisao,
        );

        $faixas = $this->carregarFaixas->executar($origem, $tokenOrigem, $resumo->id);
        foreach ($faixas as $faixa) {
            ++$ordem;
            new ItemTransferenciaPlaylist(
                transferencia: $transferencia,
                ordem: $ordem,
                idExternoOrigem: $faixa->idExterno,
                tituloOrigem: $faixa->titulo,
                artistasOrigem: $faixa->artistas,
                duracaoMsOrigem: $faixa->duracaoMs,
                urlCapaOrigem: $faixa->urlCapa,
                playlistSelecionada: $selecionada,
            );
        }

        $transferencia->incrementarTotalFaixas(count($faixas));

        return $ordem;
    }

    private function garantirContas(Usuario $usuario, ServicoPlaylist $origem, ServicoPlaylist $destino): void
    {
        if ($origem->isSpotify() || $destino->isSpotify()) {
            $contaSpotify = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
            if (null === $contaSpotify) {
                throw TransferenciaPlaylistException::contaSpotifyNecessaria();
            }
            if (!$contaSpotify->temEscoposPlaylist()) {
                throw TransferenciaPlaylistException::escoposPlaylistSpotifyAusentes();
            }
        }

        if ($origem->isYoutube() || $destino->isYoutube()) {
            if (null === $this->contaYoutubeOAuthRepository->buscarDoUsuario($usuario)) {
                throw TransferenciaPlaylistException::contaYoutubeOAuthNecessaria();
            }
        }
    }

    private function obterTokenOrigem(Usuario $usuario, ServicoPlaylist $origem): string
    {
        if ($origem->isSpotify()) {
            $conta = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
            if (null === $conta) {
                throw TransferenciaPlaylistException::contaSpotifyNecessaria();
            }

            return $this->obterTokenSpotify->executar($conta);
        }

        $conta = $this->contaYoutubeOAuthRepository->buscarDoUsuario($usuario);
        if (null === $conta) {
            throw TransferenciaPlaylistException::contaYoutubeOAuthNecessaria();
        }

        return $this->obterTokenYoutube->executar($conta);
    }
}
