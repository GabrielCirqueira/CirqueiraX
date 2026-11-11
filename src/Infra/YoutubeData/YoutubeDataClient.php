<?php

declare(strict_types=1);

namespace App\Infra\YoutubeData;

use App\DataObject\YoutubeData\ListaVideosYoutubeDataDTO;
use App\DataObject\YoutubeData\VideoYoutubeDataDTO;
use App\Exception\YoutubeData\YoutubeDataException;
use App\Interface\YoutubeDataInterface;
use DateInterval;
use Exception;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\BadResponseException;
use GuzzleHttp\Exception\GuzzleException;
use JsonException;
use SensitiveParameter;

final readonly class YoutubeDataClient implements YoutubeDataInterface
{
    private const string CAMINHO_VIDEOS = 'videos';
    private const string PARTES = 'snippet,contentDetails';
    private const string CABECALHO_CHAVE = 'X-goog-api-key';
    private const int TIMEOUT_SEGUNDOS = 15;
    private const int TAMANHO_MAXIMO_DESCRICAO = 1000;
    private const int SEGUNDOS_POR_MINUTO = 60;
    private const int MINUTOS_POR_HORA = 60;
    private const int HORAS_POR_DIA = 24;
    private const int MILISSEGUNDOS_POR_SEGUNDO = 1000;
    private const array MOTIVOS_COTA = ['quotaExceeded', 'dailyLimitExceeded'];
    private const array MOTIVOS_CHAVE = ['keyInvalid', 'API_KEY_INVALID', 'accessNotConfigured', 'forbidden', 'ipRefererBlocked'];
    private const array ORDEM_CAPAS = ['maxres', 'standard', 'high', 'medium', 'default'];

    public function __construct(
        private ClientInterface $client,
        #[SensitiveParameter]
        private string $chaveApi,
    ) {
    }

    public function buscarVideos(array $videoIds): ListaVideosYoutubeDataDTO
    {
        if ('' === trim($this->chaveApi)) {
            throw YoutubeDataException::chaveInvalida();
        }

        $ids = array_values(array_unique(array_filter($videoIds, static fn (string $id): bool => '' !== trim($id))));
        $videos = [];
        $chamadas = 0;

        foreach (array_chunk($ids, self::TAMANHO_LOTE) as $lote) {
            ++$chamadas;
            foreach ($this->consultarLote($lote) as $item) {
                $video = $this->mapearVideo($item);
                $videos[$video->videoId] = $video;
            }
        }

        return new ListaVideosYoutubeDataDTO(
            $videos,
            array_values(array_filter($ids, static fn (string $id): bool => !isset($videos[$id]))),
            $chamadas,
        );
    }

    public static function converterDuracaoMs(?string $duracaoIso): ?int
    {
        if (null === $duracaoIso || '' === $duracaoIso) {
            return null;
        }

        try {
            $intervalo = new DateInterval($duracaoIso);
        } catch (Exception) {
            return null;
        }

        $horas = (int) $intervalo->d * self::HORAS_POR_DIA + $intervalo->h;
        $segundos = ($horas * self::MINUTOS_POR_HORA + $intervalo->i) * self::SEGUNDOS_POR_MINUTO + $intervalo->s;

        return $segundos * self::MILISSEGUNDOS_POR_SEGUNDO;
    }

    /**
     * @param list<string> $lote
     *
     * @return list<array<string, mixed>>
     */
    private function consultarLote(array $lote): array
    {
        try {
            $resposta = $this->client->request('GET', self::CAMINHO_VIDEOS, [
                'query' => ['part' => self::PARTES, 'id' => implode(',', $lote), 'maxResults' => self::TAMANHO_LOTE],
                'headers' => [self::CABECALHO_CHAVE => $this->chaveApi],
                'timeout' => self::TIMEOUT_SEGUNDOS,
            ]);
        } catch (BadResponseException $erro) {
            throw $this->classificarErro((string) $erro->getResponse()->getBody());
        } catch (GuzzleException) {
            throw YoutubeDataException::servicoIndisponivel();
        }

        try {
            $dados = json_decode((string) $resposta->getBody(), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw YoutubeDataException::respostaInesperada();
        }

        if (!is_array($dados) || !isset($dados['items']) || !is_array($dados['items'])) {
            throw YoutubeDataException::respostaInesperada();
        }

        return array_values(array_filter($dados['items'], 'is_array'));
    }

    private function classificarErro(string $corpo): YoutubeDataException
    {
        $motivos = $this->extrairMotivos($corpo);

        if ([] !== array_intersect($motivos, self::MOTIVOS_COTA)) {
            return YoutubeDataException::cotaExcedida();
        }

        if ([] !== array_intersect($motivos, self::MOTIVOS_CHAVE)) {
            return YoutubeDataException::chaveInvalida();
        }

        return YoutubeDataException::servicoIndisponivel();
    }

    /**
     * @return list<string>
     */
    private function extrairMotivos(string $corpo): array
    {
        $dados = json_decode($corpo, true);
        $erro = is_array($dados) && is_array($dados['error'] ?? null) ? $dados['error'] : [];
        $motivos = [];

        foreach (['errors', 'details'] as $chave) {
            foreach (is_array($erro[$chave] ?? null) ? $erro[$chave] : [] as $detalhe) {
                if (is_array($detalhe) && is_string($detalhe['reason'] ?? null)) {
                    $motivos[] = $detalhe['reason'];
                }
            }
        }

        return $motivos;
    }

    /**
     * @param array<string, mixed> $item
     */
    private function mapearVideo(array $item): VideoYoutubeDataDTO
    {
        $snippet = is_array($item['snippet'] ?? null) ? $item['snippet'] : [];
        $detalhes = is_array($item['contentDetails'] ?? null) ? $item['contentDetails'] : [];

        if (!is_string($item['id'] ?? null)) {
            throw YoutubeDataException::respostaInesperada();
        }

        $descricao = is_string($snippet['description'] ?? null) ? mb_substr($snippet['description'], 0, self::TAMANHO_MAXIMO_DESCRICAO) : null;

        return new VideoYoutubeDataDTO(
            $item['id'],
            is_string($snippet['title'] ?? null) ? $snippet['title'] : '',
            is_string($snippet['channelTitle'] ?? null) ? $snippet['channelTitle'] : '',
            is_string($snippet['channelId'] ?? null) ? $snippet['channelId'] : null,
            is_string($snippet['categoryId'] ?? null) ? $snippet['categoryId'] : null,
            self::converterDuracaoMs(is_string($detalhes['duration'] ?? null) ? $detalhes['duration'] : null),
            $descricao,
            $this->escolherCapa(is_array($snippet['thumbnails'] ?? null) ? $snippet['thumbnails'] : []),
        );
    }

    /**
     * @param array<string, mixed> $capas
     */
    private function escolherCapa(array $capas): ?string
    {
        foreach (self::ORDEM_CAPAS as $tamanho) {
            $capa = $capas[$tamanho] ?? null;
            if (is_array($capa) && is_string($capa['url'] ?? null)) {
                return $capa['url'];
            }
        }

        return null;
    }
}
