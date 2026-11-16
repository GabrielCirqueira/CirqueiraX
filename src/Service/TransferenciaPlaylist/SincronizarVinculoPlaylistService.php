<?php

declare(strict_types=1);

namespace App\Service\TransferenciaPlaylist;

use App\DataObject\TransferenciaPlaylist\FaixaPlaylistDTO;
use App\Entity\Usuario;
use App\Entity\VinculoPlaylist;
use App\Enum\ServicoPlaylist;
use App\Exception\TransferenciaPlaylist\TransferenciaPlaylistException;
use App\Exception\YoutubeOAuth\YoutubeOAuthException;
use App\Interface\SpotifyInterface;
use App\Interface\YoutubePlaylistInterface;
use App\Message\SincronizarVinculoPlaylistMessage;
use App\Repository\ContaSpotifyRepository;
use App\Repository\ContaYoutubeOAuthRepository;
use App\Repository\VinculoPlaylistRepository;
use App\Service\Spotify\ObterTokenValidoSpotifyService;
use App\Service\YoutubeOAuth\ObterTokenValidoYoutubeOAuthService;
use JsonException;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class SincronizarVinculoPlaylistService
{
    private const float LIMITE_REMOCAO_SEM_FORCE = 0.30;
    private const string PREFIXO_URI_FAIXA = 'spotify:track:';
    private const int ESPERA_YOUTUBE_MICROSEGUNDOS = 200000;

    public function __construct(
        private CarregarFaixasPlaylistService $carregarFaixas,
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ContaYoutubeOAuthRepository $contaYoutubeOAuthRepository,
        private MessageBusInterface $messageBus,
        private ObterTokenValidoSpotifyService $obterTokenSpotify,
        private ObterTokenValidoYoutubeOAuthService $obterTokenYoutube,
        private SpotifyInterface $spotify,
        private VinculoPlaylistRepository $vinculoRepository,
        private YoutubePlaylistInterface $youtubePlaylist,
    ) {
    }

    public function enfileirar(Usuario $usuario, string $vinculoUuid, bool $force = false): VinculoPlaylist
    {
        $vinculo = $this->vinculoRepository->buscarDoUsuarioPorUuid($usuario, $vinculoUuid);
        if (null === $vinculo) {
            throw TransferenciaPlaylistException::vinculoNaoEncontrado();
        }

        $this->messageBus->dispatch(new SincronizarVinculoPlaylistMessage($vinculo->uuid()->toRfc4122(), $force));

        return $vinculo;
    }

    public function executar(string $vinculoUuid, bool $force = false): void
    {
        $vinculo = $this->vinculoRepository->buscarPorUuid($vinculoUuid);
        if (null === $vinculo || !$vinculo->isAtivo()) {
            return;
        }

        $contaSpotify = $this->contaSpotifyRepository->buscarDoUsuario($vinculo->usuario());
        $contaYoutube = $this->contaYoutubeOAuthRepository->buscarDoUsuario($vinculo->usuario());
        if (null === $contaSpotify || null === $contaYoutube) {
            return;
        }

        $tokenSpotify = $this->obterTokenSpotify->executar($contaSpotify);
        $tokenYoutube = $this->obterTokenYoutube->executar($contaYoutube);

        $faixasSpotify = $this->carregarFaixas->executar(
            ServicoPlaylist::Spotify,
            $tokenSpotify,
            $vinculo->idSpotify(),
        );
        $faixasYoutube = $this->carregarFaixas->executar(
            ServicoPlaylist::Youtube,
            $tokenYoutube,
            $vinculo->idYoutube(),
        );

        $idsSpotify = array_values(array_map(static fn ($f): string => $f->idExterno, $faixasSpotify));
        $idsYoutube = array_values(array_map(static fn ($f): string => $f->idExterno, $faixasYoutube));

        $fotoAnterior = $this->decodificarFoto($vinculo->fotoEstadoJson());
        $idsOrigemAnteriores = $this->extrairIdsOrigem($fotoAnterior, $vinculo);

        if ($vinculo->modo()->isSpotifyParaYoutube() || $vinculo->modo()->isBidirecional()) {
            $this->sincronizarSpotifyParaYoutube($vinculo, $tokenYoutube, $idsSpotify, $idsYoutube, $idsOrigemAnteriores, $force, $faixasYoutube);
        }

        if ($vinculo->modo()->isYoutubeParaSpotify() || $vinculo->modo()->isBidirecional()) {
            $this->sincronizarYoutubeParaSpotify($vinculo, $tokenSpotify, $idsYoutube, $idsSpotify, $idsOrigemAnteriores, $force);
        }

        $estado = [];
        foreach ($idsSpotify as $id) {
            $estado[] = ['spotify' => $id];
        }
        foreach ($idsYoutube as $id) {
            $estado[] = ['youtube' => $id];
        }

        $vinculo->registrarSincronizacao((string) json_encode($estado, JSON_THROW_ON_ERROR));
        $this->vinculoRepository->salvar($vinculo);
    }

    /**
     * @param list<string> $idsSpotify
     * @param list<string> $idsYoutube
     * @param list<string> $idsOrigemAnteriores
     * @param list<FaixaPlaylistDTO> $faixasYoutube
     */
    private function sincronizarSpotifyParaYoutube(
        VinculoPlaylist $vinculo,
        string $tokenYoutube,
        array $idsSpotify,
        array $idsYoutube,
        array $idsOrigemAnteriores,
        bool $force,
        array $faixasYoutube,
    ): void {
        $mapaDestinoPorOrigem = $this->mapaDestinoPorOrigem($vinculo->fotoEstadoJson());
        $remocoes = [];
        foreach ($idsOrigemAnteriores as $idOrigem) {
            if (in_array($idOrigem, $idsSpotify, true)) {
                continue;
            }
            $destino = $mapaDestinoPorOrigem[$idOrigem] ?? null;
            if (null !== $destino) {
                $remocoes[] = $destino;
            }
        }

        $this->validarRemocoes(count($idsYoutube), count($remocoes), $force);

        foreach ($remocoes as $videoId) {
            $itemPlaylistId = $this->encontrarItemPlaylistYoutube($faixasYoutube, $videoId);
            if (null === $itemPlaylistId) {
                continue;
            }
            try {
                $this->youtubePlaylist->removerItemPlaylist($tokenYoutube, $itemPlaylistId);
            } catch (YoutubeOAuthException) {
                continue;
            }
            usleep(self::ESPERA_YOUTUBE_MICROSEGUNDOS);
        }
    }

    /**
     * @param list<string> $idsYoutube
     * @param list<string> $idsSpotify
     * @param list<string> $idsOrigemAnteriores
     */
    private function sincronizarYoutubeParaSpotify(
        VinculoPlaylist $vinculo,
        string $tokenSpotify,
        array $idsYoutube,
        array $idsSpotify,
        array $idsOrigemAnteriores,
        bool $force,
    ): void {
        $mapaDestinoPorOrigem = $this->mapaDestinoPorOrigem($vinculo->fotoEstadoJson());
        $remocoes = [];
        foreach ($idsOrigemAnteriores as $idOrigem) {
            if (in_array($idOrigem, $idsYoutube, true)) {
                continue;
            }
            $destino = $mapaDestinoPorOrigem[$idOrigem] ?? null;
            if (null !== $destino) {
                $remocoes[] = self::PREFIXO_URI_FAIXA.$destino;
            }
        }

        $this->validarRemocoes(count($idsSpotify), count($remocoes), $force);

        if ([] !== $remocoes) {
            $this->spotify->removerItensPlaylist($tokenSpotify, $vinculo->idSpotify(), $remocoes);
        }
    }

    private function validarRemocoes(int $totalAtual, int $totalRemocoes, bool $force): void
    {
        if ($force || $totalAtual <= 0 || $totalRemocoes <= 0) {
            return;
        }

        if (($totalRemocoes / $totalAtual) > self::LIMITE_REMOCAO_SEM_FORCE) {
            throw TransferenciaPlaylistException::remocoesExcedemLimiteSeguranca();
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function decodificarFoto(?string $fotoEstadoJson): array
    {
        if (null === $fotoEstadoJson || '' === trim($fotoEstadoJson)) {
            return [];
        }

        try {
            $dados = json_decode($fotoEstadoJson, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return [];
        }

        return is_array($dados) ? $dados : [];
    }

    /**
     * @param list<array<string, mixed>> $foto
     *
     * @return list<string>
     */
    private function extrairIdsOrigem(array $foto, VinculoPlaylist $vinculo): array
    {
        $ids = [];
        foreach ($foto as $item) {
            if (!is_array($item)) {
                continue;
            }
            if ($vinculo->modo()->isSpotifyParaYoutube() && isset($item['origem']) && is_string($item['origem'])) {
                $ids[] = $item['origem'];
            }
            if ($vinculo->modo()->isYoutubeParaSpotify() && isset($item['origem']) && is_string($item['origem'])) {
                $ids[] = $item['origem'];
            }
            if (isset($item['spotify']) && is_string($item['spotify']) && $vinculo->modo()->isSpotifyParaYoutube()) {
                $ids[] = $item['spotify'];
            }
            if (isset($item['youtube']) && is_string($item['youtube']) && $vinculo->modo()->isYoutubeParaSpotify()) {
                $ids[] = $item['youtube'];
            }
        }

        return array_values(array_unique($ids));
    }

    /**
     * @return array<string, string>
     */
    private function mapaDestinoPorOrigem(?string $fotoEstadoJson): array
    {
        $mapa = [];
        foreach ($this->decodificarFoto($fotoEstadoJson) as $item) {
            if (!is_array($item)) {
                continue;
            }
            $origem = isset($item['origem']) && is_string($item['origem']) ? $item['origem'] : null;
            $destino = isset($item['destino']) && is_string($item['destino']) ? $item['destino'] : null;
            if (null !== $origem && null !== $destino) {
                $mapa[$origem] = $destino;
            }
        }

        return $mapa;
    }

    /**
     * @param list<FaixaPlaylistDTO> $faixas
     */
    private function encontrarItemPlaylistYoutube(array $faixas, string $videoId): ?string
    {
        foreach ($faixas as $faixa) {
            if ($faixa->idExterno === $videoId) {
                return $faixa->idItemPlaylist;
            }
        }

        return null;
    }
}
