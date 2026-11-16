<?php

declare(strict_types=1);

namespace App\Infra\YoutubeData;

use App\DataObject\TransferenciaPlaylist\CanalYoutubeOAuthDTO;
use App\DataObject\TransferenciaPlaylist\FaixaPlaylistDTO;
use App\DataObject\TransferenciaPlaylist\ListaFaixasPlaylistDTO;
use App\DataObject\TransferenciaPlaylist\ListaPlaylistsDTO;
use App\DataObject\TransferenciaPlaylist\PlaylistResumoDTO;
use App\Exception\YoutubeOAuth\YoutubeOAuthException;
use App\Interface\YoutubePlaylistInterface;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\BadResponseException;
use GuzzleHttp\Exception\GuzzleException;
use JsonException;

final class YoutubePlaylistClient implements YoutubePlaylistInterface
{
    private const int TIMEOUT_SEGUNDOS = 20;
    private const int LIMITE_MAXIMO = 50;
    private const string PRIVACIDADE_PADRAO = 'private';
    private const array MOTIVOS_COTA = ['quotaExceeded', 'dailyLimitExceeded'];
    private const array ORDEM_CAPAS = ['maxres', 'standard', 'high', 'medium', 'default'];

    public function __construct(
        private ClientInterface $client,
    ) {
    }

    public function listarMinhasPlaylists(string $accessToken, int $limite = 50, ?string $pageToken = null): ListaPlaylistsDTO
    {
        $limiteSanitizado = max(1, min($limite, self::LIMITE_MAXIMO));
        $query = [
            'part' => 'snippet,contentDetails',
            'mine' => 'true',
            'maxResults' => $limiteSanitizado,
        ];
        if (null !== $pageToken && '' !== trim($pageToken)) {
            $query['pageToken'] = $pageToken;
        }

        $dados = $this->requisitar('GET', 'playlists', $accessToken, ['query' => $query]);
        $itensBrutos = isset($dados['items']) && is_array($dados['items']) ? $dados['items'] : [];
        $itens = [];
        foreach ($itensBrutos as $itemBruto) {
            if (is_array($itemBruto)) {
                $itens[] = $this->mapearPlaylist($itemBruto);
            }
        }

        $pageInfo = is_array($dados['pageInfo'] ?? null) ? $dados['pageInfo'] : [];
        $total = isset($pageInfo['totalResults']) && is_numeric($pageInfo['totalResults'])
            ? (int) $pageInfo['totalResults']
            : count($itens);
        $proximoPageToken = isset($dados['nextPageToken']) && is_string($dados['nextPageToken'])
            ? $dados['nextPageToken']
            : null;

        return new ListaPlaylistsDTO($itens, $total, $proximoPageToken);
    }

    public function listarItensPlaylist(string $accessToken, string $playlistId, int $limite = 50, ?string $pageToken = null): ListaFaixasPlaylistDTO
    {
        $limiteSanitizado = max(1, min($limite, self::LIMITE_MAXIMO));
        $query = [
            'part' => 'snippet,contentDetails',
            'playlistId' => $playlistId,
            'maxResults' => $limiteSanitizado,
        ];
        if (null !== $pageToken && '' !== trim($pageToken)) {
            $query['pageToken'] = $pageToken;
        }

        $dados = $this->requisitar('GET', 'playlistItems', $accessToken, ['query' => $query]);
        $itensBrutos = isset($dados['items']) && is_array($dados['items']) ? $dados['items'] : [];
        $itens = [];
        foreach ($itensBrutos as $itemBruto) {
            if (!is_array($itemBruto)) {
                continue;
            }
            $faixa = $this->mapearItemPlaylist($itemBruto);
            if (null !== $faixa) {
                $itens[] = $faixa;
            }
        }

        $pageInfo = is_array($dados['pageInfo'] ?? null) ? $dados['pageInfo'] : [];
        $total = isset($pageInfo['totalResults']) && is_numeric($pageInfo['totalResults'])
            ? (int) $pageInfo['totalResults']
            : count($itens);
        $proximoPageToken = isset($dados['nextPageToken']) && is_string($dados['nextPageToken'])
            ? $dados['nextPageToken']
            : null;

        return new ListaFaixasPlaylistDTO($itens, $total, null, $proximoPageToken);
    }

    public function criarPlaylist(string $accessToken, string $titulo, ?string $descricao = null, string $privacyStatus = self::PRIVACIDADE_PADRAO): PlaylistResumoDTO
    {
        $corpo = [
            'snippet' => [
                'title' => $titulo,
            ],
            'status' => [
                'privacyStatus' => $privacyStatus,
            ],
        ];
        if (null !== $descricao && '' !== trim($descricao)) {
            $corpo['snippet']['description'] = $descricao;
        }

        $dados = $this->requisitar('POST', 'playlists', $accessToken, [
            'query' => ['part' => 'snippet,status,contentDetails'],
            'json' => $corpo,
        ]);

        return $this->mapearPlaylist($dados);
    }

    public function adicionarItemPlaylist(string $accessToken, string $playlistId, string $videoId): string
    {
        $dados = $this->requisitar('POST', 'playlistItems', $accessToken, [
            'query' => ['part' => 'snippet'],
            'json' => [
                'snippet' => [
                    'playlistId' => $playlistId,
                    'resourceId' => [
                        'kind' => 'youtube#video',
                        'videoId' => $videoId,
                    ],
                ],
            ],
        ]);

        $id = isset($dados['id']) && is_string($dados['id']) ? $dados['id'] : '';
        if ('' === $id) {
            throw YoutubeOAuthException::respostaInesperada();
        }

        return $id;
    }

    public function removerItemPlaylist(string $accessToken, string $playlistItemId): void
    {
        $this->requisitar('DELETE', 'playlistItems', $accessToken, [
            'query' => ['id' => $playlistItemId],
        ]);
    }

    public function obterCanalAutenticado(string $accessToken): CanalYoutubeOAuthDTO
    {
        $dados = $this->requisitar('GET', 'channels', $accessToken, [
            'query' => [
                'part' => 'snippet',
                'mine' => 'true',
            ],
        ]);

        $itens = isset($dados['items']) && is_array($dados['items']) ? $dados['items'] : [];
        $primeiro = $itens[0] ?? null;
        if (!is_array($primeiro)) {
            throw YoutubeOAuthException::respostaInesperada();
        }

        $snippet = is_array($primeiro['snippet'] ?? null) ? $primeiro['snippet'] : [];
        $canalId = isset($primeiro['id']) && is_string($primeiro['id']) ? $primeiro['id'] : '';
        $titulo = isset($snippet['title']) && is_string($snippet['title']) ? $snippet['title'] : '';
        if ('' === $canalId) {
            throw YoutubeOAuthException::respostaInesperada();
        }

        return new CanalYoutubeOAuthDTO($canalId, $titulo);
    }

    /**
     * @param array<string, mixed> $opcoes
     *
     * @return array<string, mixed>
     */
    private function requisitar(string $metodo, string $caminho, string $accessToken, array $opcoes = []): array
    {
        $headers = [
            'Authorization' => 'Bearer '.$accessToken,
            'Accept' => 'application/json',
        ];
        if (isset($opcoes['json'])) {
            $headers['Content-Type'] = 'application/json';
        }

        try {
            $resposta = $this->client->request($metodo, $caminho, array_merge($opcoes, [
                'headers' => array_merge($headers, is_array($opcoes['headers'] ?? null) ? $opcoes['headers'] : []),
                'timeout' => self::TIMEOUT_SEGUNDOS,
            ]));
        } catch (BadResponseException $erro) {
            throw $this->classificarErro((string) $erro->getResponse()->getBody(), $erro->getResponse()->getStatusCode());
        } catch (GuzzleException) {
            throw YoutubeOAuthException::falhaServicoYoutube();
        }

        $corpo = trim((string) $resposta->getBody());
        if ('' === $corpo) {
            return [];
        }

        try {
            $dados = json_decode($corpo, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw YoutubeOAuthException::respostaInesperada();
        }

        if (!is_array($dados)) {
            throw YoutubeOAuthException::respostaInesperada();
        }

        return $dados;
    }

    private function classificarErro(string $corpo, int $status): YoutubeOAuthException
    {
        try {
            $dados = json_decode($corpo, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return YoutubeOAuthException::respostaInesperada();
        }

        $erro = is_array($dados['error'] ?? null) ? $dados['error'] : [];
        $erros = is_array($erro['errors'] ?? null) ? $erro['errors'] : [];
        foreach ($erros as $detalhe) {
            if (!is_array($detalhe)) {
                continue;
            }
            $motivo = isset($detalhe['reason']) && is_string($detalhe['reason']) ? $detalhe['reason'] : '';
            if (in_array($motivo, self::MOTIVOS_COTA, true)) {
                return YoutubeOAuthException::cotaExcedida();
            }
        }

        if (401 === $status) {
            return YoutubeOAuthException::tokenInvalidoOuExpirado();
        }

        return YoutubeOAuthException::falhaServicoYoutube();
    }

    /**
     * @param array<string, mixed> $dados
     */
    private function mapearPlaylist(array $dados): PlaylistResumoDTO
    {
        $snippet = is_array($dados['snippet'] ?? null) ? $dados['snippet'] : [];
        $contentDetails = is_array($dados['contentDetails'] ?? null) ? $dados['contentDetails'] : [];
        $thumbnails = is_array($snippet['thumbnails'] ?? null) ? $snippet['thumbnails'] : [];

        return new PlaylistResumoDTO(
            id: isset($dados['id']) && is_string($dados['id']) ? $dados['id'] : '',
            nome: isset($snippet['title']) && is_string($snippet['title']) ? $snippet['title'] : '',
            totalFaixas: isset($contentDetails['itemCount']) && is_numeric($contentDetails['itemCount'])
                ? (int) $contentDetails['itemCount']
                : 0,
            urlCapa: $this->extrairCapa($thumbnails),
            snapshotId: null,
            dono: isset($snippet['channelTitle']) && is_string($snippet['channelTitle']) ? $snippet['channelTitle'] : null,
        );
    }

    /**
     * @param array<string, mixed> $dados
     */
    private function mapearItemPlaylist(array $dados): ?FaixaPlaylistDTO
    {
        $snippet = is_array($dados['snippet'] ?? null) ? $dados['snippet'] : [];
        $contentDetails = is_array($dados['contentDetails'] ?? null) ? $dados['contentDetails'] : [];
        $resourceId = is_array($snippet['resourceId'] ?? null) ? $snippet['resourceId'] : [];
        $videoId = isset($resourceId['videoId']) && is_string($resourceId['videoId'])
            ? $resourceId['videoId']
            : (isset($contentDetails['videoId']) && is_string($contentDetails['videoId']) ? $contentDetails['videoId'] : '');
        if ('' === $videoId) {
            return null;
        }

        $thumbnails = is_array($snippet['thumbnails'] ?? null) ? $snippet['thumbnails'] : [];
        $playlistItemId = isset($dados['id']) && is_string($dados['id']) ? $dados['id'] : null;
        $posicao = isset($snippet['position']) && is_numeric($snippet['position']) ? (int) $snippet['position'] : null;

        return new FaixaPlaylistDTO(
            idExterno: $videoId,
            titulo: isset($snippet['title']) && is_string($snippet['title']) ? $snippet['title'] : '',
            artistas: isset($snippet['videoOwnerChannelTitle']) && is_string($snippet['videoOwnerChannelTitle'])
                ? $snippet['videoOwnerChannelTitle']
                : (isset($snippet['channelTitle']) && is_string($snippet['channelTitle']) ? $snippet['channelTitle'] : ''),
            duracaoMs: null,
            urlCapa: $this->extrairCapa($thumbnails),
            uri: null,
            idItemPlaylist: $playlistItemId,
            posicao: $posicao,
        );
    }

    /**
     * @param array<string, mixed> $thumbnails
     */
    private function extrairCapa(array $thumbnails): ?string
    {
        foreach (self::ORDEM_CAPAS as $chave) {
            $item = $thumbnails[$chave] ?? null;
            if (is_array($item) && isset($item['url']) && is_string($item['url']) && '' !== $item['url']) {
                return $item['url'];
            }
        }

        return null;
    }
}
