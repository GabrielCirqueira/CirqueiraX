<?php

declare(strict_types=1);

namespace App\Infra\YtDlp;

use App\DataObject\AudioBaixadoDTO;
use App\Exception\Video\YtDlpException;
use App\Interface\ExtratorAudioInterface;
use App\Interface\ExtratorVideoInterface;
use Symfony\Component\Process\Process;

final class YtDlpClient implements ExtratorVideoInterface, ExtratorAudioInterface
{
    private const float TIMEOUT_EXTRACAO_METADATA_SEGUNDOS = 60.0;
    private const float TIMEOUT_DOWNLOAD_VIDEO_SEGUNDOS = 300.0;
    private const string FORMATO_VIDEO_PREFERIDO = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
    private const string ORDENACAO_FORMATO_VIDEO = 'res:1080,vcodec:h264';
    private const float TIMEOUT_DOWNLOAD_AUDIO_SEGUNDOS = 900.0;
    private const string FORMATO_AUDIO = 'mp3';
    private const string QUALIDADE_AUDIO = '0';
    private const string FORMATO_THUMBNAIL_AUDIO = 'jpg';
    private const string CAMPOS_AUDIO_BAIXADO = 'after_move:%(.{filepath,title,uploader,channel,duration,thumbnail})j';

    private const string USER_AGENT_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

    /** @var array<string, array<string, mixed>> */
    private array $metadataCache = [];

    public function __construct(
        private ?string $cookiesPath = null,
        private string $projectDir = '',
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function extrairMetadata(string $url): array
    {
        if (isset($this->metadataCache[$url])) {
            $cached = $this->metadataCache[$url];
            unset($this->metadataCache[$url]);

            return $cached;
        }

        if ($this->ehUrlTiktok($url)) {
            $infoTikwm = $this->consultarTikwmApi($url);
            if (null !== $infoTikwm) {
                return $infoTikwm['metadata'];
            }
        }

        $process = $this->executarYtDlpComFallback($url, function (string $alvoUrl): array {
            $comando = ['yt-dlp', '--dump-json', '--no-playlist'];
            $this->adicionarFlagsPlataforma($comando, $alvoUrl);
            $comando[] = $alvoUrl;

            return $comando;
        }, self::TIMEOUT_EXTRACAO_METADATA_SEGUNDOS);

        if (!$process->isSuccessful()) {
            if ($this->ehUrlTiktok($url)) {
                $oembed = $this->buscarOembedTiktok($url);
                if (null !== $oembed && null !== ($oembed['title'] ?? null)) {
                    return $oembed;
                }
            }
            if ($this->ehUrlTwitter($url)) {
                $infoFxtwitter = $this->consultarFxtwitterApi($url);
                if (null !== $infoFxtwitter) {
                    return $infoFxtwitter['metadata'];
                }
            }
            $motivo = $this->extrairMensagemErroRelevante($process->getErrorOutput());
            throw YtDlpException::falhaAoExtrairMetadataDoVideo($motivo);
        }

        /** @var mixed $dados */
        $dados = json_decode($process->getOutput(), true);
        if (!is_array($dados)) {
            throw YtDlpException::falhaAoProcessarJsonDeMetadata();
        }

        /** @var array<string, mixed> $dados */
        return $this->enriquecerMetadataTiktokComOembed($url, $dados);
    }

    public function baixarVideo(string $url, string $diretorioDestino): string
    {
        if ($this->ehUrlTiktok($url)) {
            $caminhoTikwm = $this->baixarTiktokViaTikwm($url, $diretorioDestino);
            if (null !== $caminhoTikwm) {
                return $caminhoTikwm;
            }
        }

        $templateSaida = $diretorioDestino . '/%(id)s.%(ext)s';
        $process = $this->executarYtDlpComFallback($url, function (string $alvoUrl) use ($templateSaida): array {
            $comando = [
                'yt-dlp',
                '--no-playlist',
                '--no-mtime',
                '--force-overwrites',
                '--write-info-json',
                '--format',
                self::FORMATO_VIDEO_PREFERIDO,
                '--format-sort',
                self::ORDENACAO_FORMATO_VIDEO,
                '--output',
                $templateSaida,
                '--print',
                'after_move:filepath',
            ];

            $this->adicionarFlagsPlataforma($comando, $alvoUrl);
            $comando[] = $alvoUrl;

            return $comando;
        }, self::TIMEOUT_DOWNLOAD_VIDEO_SEGUNDOS);

        if (!$process->isSuccessful()) {
            // Tweets marcados como sensíveis não mostram a mídia para o guest token do yt-dlp
            if ($this->ehUrlTwitter($url)) {
                $caminhoFxtwitter = $this->baixarTwitterViaFxtwitter($url, $diretorioDestino);
                if (null !== $caminhoFxtwitter) {
                    return $caminhoFxtwitter;
                }
            }

            $motivo = $this->extrairMensagemErroRelevante($process->getErrorOutput());
            throw YtDlpException::falhaAoEfetuarDownloadDoVideo($motivo);
        }

        $linhas = array_filter(explode("\n", trim($process->getOutput())));
        $caminhoArquivo = trim((string) end($linhas));

        if ('' === $caminhoArquivo || !file_exists($caminhoArquivo)) {
            throw YtDlpException::arquivoDeVideoBaixadoNaoEncontrado();
        }

        $caminhoInfoJson = preg_replace('/\.[^.\/]+$/', '.info.json', $caminhoArquivo);
        if (is_string($caminhoInfoJson) && file_exists($caminhoInfoJson)) {
            $conteudoJson = @file_get_contents($caminhoInfoJson);
            @unlink($caminhoInfoJson);
            if (is_string($conteudoJson) && '' !== $conteudoJson) {
                $dados = json_decode($conteudoJson, true);
                if (is_array($dados)) {
                    /** @var array<string, mixed> $dados */
                    $this->metadataCache[$url] = $this->enriquecerMetadataTiktokComOembed($url, $dados);
                }
            }
        }

        return $caminhoArquivo;
    }

    public function baixarAudio(string $url, string $diretorioDestino, string $nomeArquivo): AudioBaixadoDTO
    {
        $templateSaida = sprintf('%s/%s.%%(ext)s', $diretorioDestino, $nomeArquivo);
        $process = $this->executarYtDlpComFallback($url, function (string $alvoUrl) use ($templateSaida): array {
            $comando = [
                'yt-dlp',
                '--no-playlist',
                '--no-mtime',
                '--force-overwrites',
                '--extract-audio',
                '--audio-format',
                self::FORMATO_AUDIO,
                '--audio-quality',
                self::QUALIDADE_AUDIO,
                '--embed-metadata',
                '--embed-thumbnail',
                '--convert-thumbnails',
                self::FORMATO_THUMBNAIL_AUDIO,
                '--output',
                $templateSaida,
                '--print',
                self::CAMPOS_AUDIO_BAIXADO,
            ];

            $this->adicionarFlagsPlataforma($comando, $alvoUrl);
            $comando[] = $alvoUrl;

            return $comando;
        }, self::TIMEOUT_DOWNLOAD_AUDIO_SEGUNDOS);

        if ($process->isSuccessful()) {
            return $this->montarAudioBaixado($this->decodificarUltimaLinhaJson($process->getOutput()));
        }

        if ($this->ehUrlTiktok($url) || $this->ehUrlTwitter($url)) {
            return $this->baixarAudioPeloVideo($url, $diretorioDestino, $nomeArquivo);
        }

        throw YtDlpException::falhaAoEfetuarDownloadDoAudio($this->extrairMensagemErroRelevante($process->getErrorOutput()));
    }

    private function baixarAudioPeloVideo(string $url, string $diretorioDestino, string $nomeArquivo): AudioBaixadoDTO
    {
        $caminhoVideo = $this->baixarVideo($url, $diretorioDestino);
        $caminhoAudio = sprintf('%s/%s.%s', $diretorioDestino, $nomeArquivo, self::FORMATO_AUDIO);

        $conversao = new Process(['ffmpeg', '-y', '-i', $caminhoVideo, '-vn', '-codec:a', 'libmp3lame', '-q:a', self::QUALIDADE_AUDIO, $caminhoAudio]);
        $conversao->setTimeout(self::TIMEOUT_DOWNLOAD_AUDIO_SEGUNDOS);
        $conversao->run();

        if (is_file($caminhoVideo)) {
            unlink($caminhoVideo);
        }

        if (!$conversao->isSuccessful()) {
            throw YtDlpException::falhaAoConverterVideoParaAudio();
        }

        $metadata = $this->extrairMetadata($url);
        $metadata['filepath'] = $caminhoAudio;

        return $this->montarAudioBaixado($metadata);
    }

    /**
     * @return array<string, mixed>
     */
    private function decodificarUltimaLinhaJson(string $saida): array
    {
        $linhas = array_filter(explode("\n", trim($saida)));
        $dados = json_decode(trim((string) end($linhas)), true);
        if (!is_array($dados)) {
            throw YtDlpException::falhaAoProcessarJsonDeMetadata();
        }

        /** @var array<string, mixed> $dados */
        return $dados;
    }

    /**
     * @param array<string, mixed> $dados
     */
    private function montarAudioBaixado(array $dados): AudioBaixadoDTO
    {
        $caminhoArquivo = $this->textoOuNulo($dados['filepath'] ?? null);
        if (null === $caminhoArquivo || !is_file($caminhoArquivo)) {
            throw YtDlpException::arquivoDeAudioBaixadoNaoEncontrado();
        }

        $duracao = $dados['duration'] ?? null;

        return new AudioBaixadoDTO(
            caminhoArquivo: $caminhoArquivo,
            tamanhoBytes: (int) filesize($caminhoArquivo),
            titulo: $this->textoOuNulo($dados['title'] ?? null),
            autor: $this->textoOuNulo($dados['uploader'] ?? null) ?? $this->textoOuNulo($dados['channel'] ?? null),
            duracaoSegundos: is_numeric($duracao) ? (int) round((float) $duracao) : null,
            thumbnailUrl: $this->textoOuNulo($dados['thumbnail'] ?? null),
        );
    }

    private function textoOuNulo(mixed $valor): ?string
    {
        return is_string($valor) && '' !== trim($valor) ? trim($valor) : null;
    }

    private function ehUrlTiktok(string $url): bool
    {
        return 1 === preg_match('/tiktok\.com/i', $url);
    }

    /**
     * Consulta a API TikWM (mesma estratégia usada pela Franky) para obter link sem marca d'água e metadados completos,
     * contornando bloqueios HTTP 403 do TikTok em IPs de datacenter.
     *
     * @return array{video_url: string, id: string, metadata: array<string, mixed>}|null
     */
    private function consultarTikwmApi(string $url): ?array
    {
        $apiUrl = 'https://www.tikwm.com/api/?url=' . urlencode(trim($url)) . '&hd=1';
        $contexto = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "User-Agent: " . self::USER_AGENT_CHROME . "\r\nAccept: application/json\r\n",
                'timeout' => 15,
                'ignore_errors' => true,
            ],
        ]);

        for ($tentativa = 1; $tentativa <= 2; ++$tentativa) {
            $resposta = @file_get_contents($apiUrl, false, $contexto);
            if (!is_string($resposta) || '' === $resposta) {
                if ($tentativa < 2) {
                    usleep(1_200_000);
                }
                continue;
            }

            $json = json_decode($resposta, true);
            if (!is_array($json)) {
                return null;
            }

            $code = $json['code'] ?? -1;
            $data = $json['data'] ?? null;

            if (0 === $code && is_array($data)) {
                $videoUrl = $data['play'] ?? ($data['hdplay'] ?? ($data['wmplay'] ?? null));
                if (!is_string($videoUrl) || '' === trim($videoUrl)) {
                    return null;
                }

                $id = isset($data['id']) && (is_string($data['id']) || is_int($data['id']))
                    ? (string) $data['id']
                    : ($this->extrairTiktokId($url) ?? (string) time());

                $author = is_array($data['author'] ?? null) ? $data['author'] : [];
                $uploader = $author['nickname'] ?? ($author['unique_id'] ?? 'TikTok');
                $uploaderId = $author['unique_id'] ?? null;
                $titulo = isset($data['title']) && is_string($data['title']) && '' !== trim($data['title'])
                    ? trim($data['title'])
                    : 'Vídeo do TikTok';
                $duracao = isset($data['duration']) && is_numeric($data['duration']) ? (int) $data['duration'] : null;
                $thumbnail = $data['cover'] ?? ($data['origin_cover'] ?? null);

                return [
                    'video_url' => $videoUrl,
                    'id' => $id,
                    'metadata' => [
                        'id' => $id,
                        'title' => $titulo,
                        'uploader' => is_string($uploader) ? $uploader : 'TikTok',
                        'uploader_id' => is_string($uploaderId) ? $uploaderId : null,
                        'duration' => $duracao,
                        'ext' => 'mp4',
                        'thumbnail' => is_string($thumbnail) ? $thumbnail : null,
                        'webpage_url' => $url,
                    ],
                ];
            }

            // Se bateu no rate-limit de 1 req/seg da TikWM, aguarda 1.2s e tenta mais uma vez
            if ($tentativa < 2) {
                usleep(1_200_000);
            }
        }

        return null;
    }

    private function baixarTiktokViaTikwm(string $url, string $diretorioDestino): ?string
    {
        $info = $this->consultarTikwmApi($url);
        if (null === $info) {
            return null;
        }

        $caminhoDestino = $this->baixarArquivoDireto(
            $info['video_url'],
            rtrim($diretorioDestino, '/') . '/' . $info['id'] . '.mp4',
            'https://www.tiktok.com/',
        );
        if (null === $caminhoDestino) {
            return null;
        }

        $this->metadataCache[$url] = $info['metadata'];

        return $caminhoDestino;
    }

    /**
     * Baixa um arquivo de vídeo direto da CDN para o caminho de destino.
     * Retorna null se o download falhar ou o arquivo vier vazio.
     */
    private function baixarArquivoDireto(string $urlArquivo, string $caminhoDestino, string $referer): ?string
    {
        $diretorio = dirname($caminhoDestino);
        if (!is_dir($diretorio)) {
            @mkdir($diretorio, 0775, true);
        }

        $contexto = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "User-Agent: " . self::USER_AGENT_CHROME . "\r\nReferer: " . $referer . "\r\nAccept: */*\r\n",
                'timeout' => 90,
                'follow_location' => 1,
            ],
        ]);

        $streamEntrada = @fopen($urlArquivo, 'rb', false, $contexto);
        if (false === $streamEntrada) {
            return null;
        }

        $streamSaida = @fopen($caminhoDestino, 'wb');
        if (false === $streamSaida) {
            @fclose($streamEntrada);

            return null;
        }

        @stream_copy_to_stream($streamEntrada, $streamSaida);
        @fclose($streamEntrada);
        @fclose($streamSaida);

        if (!file_exists($caminhoDestino) || filesize($caminhoDestino) < 1000) {
            @unlink($caminhoDestino);

            return null;
        }

        return $caminhoDestino;
    }

    private function ehUrlTwitter(string $url): bool
    {
        return null !== $this->extrairTweetId($url);
    }

    private function extrairTweetId(string $url): ?string
    {
        if (1 === preg_match('#^https?://(?:www\.|mobile\.)?(?:x|twitter)\.com/[^/]+/status(?:es)?/(\d+)#i', trim($url), $m)) {
            return $m[1];
        }

        return null;
    }

    /**
     * Consulta a API pública do FxTwitter, que devolve o MP4 inclusive de tweets marcados como sensíveis.
     *
     * @return array{video_url: string, id: string, metadata: array<string, mixed>}|null
     */
    private function consultarFxtwitterApi(string $url): ?array
    {
        $tweetId = $this->extrairTweetId($url);
        if (null === $tweetId) {
            return null;
        }

        $contexto = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "User-Agent: " . self::USER_AGENT_CHROME . "\r\nAccept: application/json\r\n",
                'timeout' => 15,
                'ignore_errors' => true,
            ],
        ]);

        $resposta = @file_get_contents('https://api.fxtwitter.com/status/' . $tweetId, false, $contexto);
        if (!is_string($resposta) || '' === $resposta) {
            return null;
        }

        $json = json_decode($resposta, true);
        $tweet = is_array($json) ? ($json['tweet'] ?? null) : null;
        if (!is_array($tweet)) {
            return null;
        }

        $videos = $tweet['media']['videos'] ?? null;
        $video = is_array($videos) && is_array($videos[0] ?? null) ? $videos[0] : null;
        $videoUrl = $video['url'] ?? null;
        if (!is_string($videoUrl) || '' === trim($videoUrl)) {
            return null;
        }

        $autor = is_array($tweet['author'] ?? null) ? $tweet['author'] : [];
        $texto = is_string($tweet['text'] ?? null) ? trim((string) preg_replace('#\s*https?://t\.co/\S+#', '', $tweet['text'])) : '';
        $duracao = isset($video['duration']) && is_numeric($video['duration']) ? (int) round((float) $video['duration']) : null;

        return [
            'video_url' => $videoUrl,
            'id' => $tweetId,
            'metadata' => [
                'id' => $tweetId,
                'title' => '' !== $texto ? mb_substr($texto, 0, 200) : 'Vídeo do X',
                'description' => '' !== $texto ? $texto : null,
                'uploader' => is_string($autor['name'] ?? null) ? $autor['name'] : 'X / Twitter',
                'uploader_id' => is_string($autor['screen_name'] ?? null) ? $autor['screen_name'] : null,
                'duration' => $duracao,
                'width' => isset($video['width']) && is_numeric($video['width']) ? (int) $video['width'] : null,
                'height' => isset($video['height']) && is_numeric($video['height']) ? (int) $video['height'] : null,
                'ext' => 'mp4',
                'thumbnail' => is_string($video['thumbnail_url'] ?? null) ? $video['thumbnail_url'] : null,
                'webpage_url' => $url,
                'extractor' => 'fxtwitter',
            ],
        ];
    }

    private function baixarTwitterViaFxtwitter(string $url, string $diretorioDestino): ?string
    {
        $info = $this->consultarFxtwitterApi($url);
        if (null === $info) {
            return null;
        }

        $caminhoDestino = $this->baixarArquivoDireto(
            $info['video_url'],
            rtrim($diretorioDestino, '/') . '/' . $info['id'] . '.mp4',
            'https://x.com/',
        );
        if (null === $caminhoDestino) {
            return null;
        }

        $this->metadataCache[$url] = $info['metadata'];

        return $caminhoDestino;
    }

    /**
     * Executa o yt-dlp com retentativa de processo em erros transitórios (403/429) e fallback para Embed URL no TikTok.
     *
     * @param callable(string): list<string> $montarComando
     */
    private function executarYtDlpComFallback(string $url, callable $montarComando, float $timeout): Process
    {
        // O Instagram devolve "empty media response" de forma intermitente para IPs de datacenter
        $maxTentativas = match (true) {
            $this->ehUrlTiktok($url) => 3,
            $this->ehUrlInstagram($url) => 2,
            default => 1,
        };
        $ultimoProcess = null;

        $urlAlvo = $this->normalizarUrl($url);

        for ($tentativa = 1; $tentativa <= $maxTentativas; ++$tentativa) {
            $ultimoProcess = new Process($montarComando($urlAlvo));
            $ultimoProcess->setTimeout($timeout);
            $ultimoProcess->run();

            if ($ultimoProcess->isSuccessful()) {
                return $ultimoProcess;
            }

            if ($this->ehErroPermanente($ultimoProcess->getErrorOutput())) {
                break;
            }

            if ($tentativa < $maxTentativas) {
                usleep(1_500_000);
            }
        }

        if ($this->ehUrlTiktok($url)) {
            $embedUrl = $this->obterTiktokEmbedUrl($url);
            if (null !== $embedUrl && $embedUrl !== $url) {
                $embedProcess = new Process($montarComando($embedUrl));
                $embedProcess->setTimeout($timeout);
                $embedProcess->run();

                if ($embedProcess->isSuccessful()) {
                    return $embedProcess;
                }
            }
        }

        /** @var Process $ultimoProcess */
        return $ultimoProcess;
    }

    /**
     * Remove parâmetros de rastreamento de links do Instagram (?igsh=, ?rpxt=, ?utm_...),
     * que não identificam o post e às vezes atrapalham a extração.
     */
    private function normalizarUrl(string $url): string
    {
        if (!$this->ehUrlInstagram($url)) {
            return $url;
        }

        $semQuery = preg_replace('/[?#].*$/', '', trim($url));

        return is_string($semQuery) && '' !== $semQuery ? $semQuery : $url;
    }

    private function ehUrlInstagram(string $url): bool
    {
        return 1 === preg_match('/instagram\.com/i', $url);
    }

    private function ehErroPermanente(string $stderr): bool
    {
        $padroes = [
            'Private video',
            'Video unavailable',
            'This video is not available',
            'has been removed',
            'Video removed',
            'was deleted',
            'is not available in your country',
            "This content isn't available",
            'This video is DRM protected',
            'There is no video in this post',
        ];

        foreach ($padroes as $padrao) {
            if (false !== stripos($stderr, $padrao)) {
                return true;
            }
        }

        return false;
    }

    private function extrairTiktokId(string $url): ?string
    {
        if (1 === preg_match('/video\/(\d+)/i', $url, $m)
            || 1 === preg_match('/\/v\/(\d+)/i', $url, $m)
            || 1 === preg_match('/embed\/v2\/(\d+)/i', $url, $m)
            || 1 === preg_match('/(\d{18,20})/', $url, $m)
        ) {
            return $m[1];
        }

        return null;
    }

    private function obterTiktokEmbedUrl(string $url): ?string
    {
        if (!$this->ehUrlTiktok($url)) {
            return null;
        }

        $id = $this->extrairTiktokId($url);

        return null !== $id ? 'https://www.tiktok.com/embed/v2/' . $id : null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function buscarOembedTiktok(string $url): ?array
    {
        if (!$this->ehUrlTiktok($url)) {
            return null;
        }

        $oembedUrl = 'https://www.tiktok.com/oembed?url=' . urlencode($url);
        $contexto = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "User-Agent: " . self::USER_AGENT_CHROME . "\r\n",
                'timeout' => 10,
                'ignore_errors' => true,
            ],
        ]);

        $res = @file_get_contents($oembedUrl, false, $contexto);
        if (!is_string($res) || '' === $res) {
            return null;
        }

        $data = json_decode($res, true);
        if (!is_array($data)) {
            return null;
        }

        return [
            'title' => $data['title'] ?? null,
            'uploader' => $data['author_name'] ?? ($data['author_unique_id'] ?? 'TikTok'),
            'uploader_id' => $data['author_unique_id'] ?? null,
            'thumbnail' => $data['thumbnail_url'] ?? null,
            'ext' => 'mp4',
            'webpage_url' => $url,
        ];
    }

    /**
     * @param array<string, mixed> $dados
     * @return array<string, mixed>
     */
    private function enriquecerMetadataTiktokComOembed(string $url, array $dados): array
    {
        if (!$this->ehUrlTiktok($url)) {
            return $dados;
        }

        $tituloAtual = isset($dados['title']) && is_string($dados['title']) ? $dados['title'] : '';
        if ('' === $tituloAtual || false !== stripos($tituloAtual, 'TikTok Embed')) {
            $oembed = $this->buscarOembedTiktok($url);
            if (null !== $oembed) {
                if (!empty($oembed['title'])) {
                    $dados['title'] = $oembed['title'];
                }
                if (empty($dados['uploader']) && !empty($oembed['uploader'])) {
                    $dados['uploader'] = $oembed['uploader'];
                }
                if (empty($dados['thumbnail']) && !empty($oembed['thumbnail'])) {
                    $dados['thumbnail'] = $oembed['thumbnail'];
                }
            }
        }

        return $dados;
    }

    /**
     * @param list<string> $comando
     */
    private function adicionarFlagsPlataforma(array &$comando, string $url): void
    {
        if (1 === preg_match('/(youtube\.com|youtu\.be)/i', $url)) {
            $arquivoCookies = $this->resolverArquivoCookies();
            if (null !== $arquivoCookies) {
                $comando[] = '--cookies';
                $comando[] = $arquivoCookies;
                $comando[] = '--remote-components';
                $comando[] = 'ejs:github';
            } else {
                $comando[] = '--extractor-args';
                $comando[] = 'youtube:player_client=android';
            }

            return;
        }

        if (1 === preg_match('/tiktok\.com/i', $url)) {
            $comando[] = '--user-agent';
            $comando[] = self::USER_AGENT_CHROME;
            $comando[] = '--referer';
            $comando[] = 'https://www.tiktok.com/';
            $comando[] = '--retries';
            $comando[] = '5';
            $comando[] = '--retry-sleep';
            $comando[] = '2';
            $comando[] = '--extractor-retries';
            $comando[] = '5';

            $arquivoCookiesTiktok = $this->resolverArquivoCookiesPlataforma('tiktok');
            if (null !== $arquivoCookiesTiktok) {
                $comando[] = '--cookies';
                $comando[] = $arquivoCookiesTiktok;
            }

            return;
        }

        if ($this->ehUrlTwitter($url)) {
            $arquivoCookiesX = $this->resolverArquivoCookiesPlataforma('x');
            if (null !== $arquivoCookiesX) {
                $comando[] = '--cookies';
                $comando[] = $arquivoCookiesX;
            }
        }

        if ($this->ehUrlInstagram($url)) {
            $comando[] = '--user-agent';
            $comando[] = self::USER_AGENT_CHROME;

            $arquivoCookiesInstagram = $this->resolverArquivoCookiesPlataforma('instagram');
            if (null !== $arquivoCookiesInstagram) {
                $comando[] = '--cookies';
                $comando[] = $arquivoCookiesInstagram;
            }
        }

        $comando[] = '--retries';
        $comando[] = '3';
        $comando[] = '--extractor-retries';
        $comando[] = '3';
    }

    private function resolverArquivoCookies(): ?string
    {
        if (null !== $this->cookiesPath && '' !== trim($this->cookiesPath) && file_exists($this->cookiesPath) && is_readable($this->cookiesPath) && filesize($this->cookiesPath) > 0) {
            return $this->cookiesPath;
        }

        $candidatos = [
            $this->projectDir . '/var/cookies/youtube.txt',
            $this->projectDir . '/var/cookies/cookies.txt',
            '/var/www/html/var/cookies/youtube.txt',
            '/var/www/html/var/cookies/cookies.txt',
            '/var/www/html/var/storage/cookies/youtube.txt',
            '/var/www/html/var/storage/cookies/cookies.txt',
        ];

        foreach ($candidatos as $candidato) {
            if (file_exists($candidato) && is_readable($candidato) && filesize($candidato) > 0) {
                return $candidato;
            }
        }

        return null;
    }

    private function resolverArquivoCookiesPlataforma(string $plataforma): ?string
    {
        $candidatos = [
            $this->projectDir . '/var/cookies/' . $plataforma . '.txt',
            '/var/www/html/var/cookies/' . $plataforma . '.txt',
            '/var/www/html/var/storage/cookies/' . $plataforma . '.txt',
        ];

        foreach ($candidatos as $candidato) {
            if (file_exists($candidato) && is_readable($candidato) && filesize($candidato) > 0) {
                return $candidato;
            }
        }

        return null;
    }

    private function extrairMensagemErroRelevante(string $stderr): ?string
    {
        if (stripos($stderr, 'The provided YouTube account cookies are no longer valid') !== false) {
            return 'Os cookies do YouTube configurados no servidor expiraram ou foram invalidados pelo Google. Por favor, exporte um novo cookies.txt pelo navegador e atualize em var/cookies/youtube.txt.';
        }

        if (false !== stripos($stderr, 'No video could be found in this tweet')) {
            return 'Não foi possível encontrar vídeo neste post do X, nem pelo yt-dlp nem pela API do FxTwitter. O post pode ter só imagem ou texto, ou o vídeo pode ter sido removido.';
        }

        if (false !== stripos($stderr, 'There is no video in this post')) {
            return 'Este post do Instagram não tem vídeo (é foto ou carrossel só de fotos). A Central de Downloads baixa apenas vídeos e Reels.';
        }

        if (false !== stripos($stderr, '[Instagram]')
            && (false !== stripos($stderr, 'empty media response')
                || false !== stripos($stderr, 'login required')
                || false !== stripos($stderr, 'rate-limit reached')
                || false !== stripos($stderr, 'Requested content is not available'))) {
            return null !== $this->resolverArquivoCookiesPlataforma('instagram')
                ? 'O Instagram recusou o acesso mesmo com os cookies do servidor. Eles podem ter expirado: exporte um novo instagram.txt logado no navegador e substitua em var/cookies/instagram.txt.'
                : 'O Instagram só libera este post com login quando o acesso vem do servidor. Exporte os cookies do instagram.com (logado) e salve em var/cookies/instagram.txt.';
        }

        $linhas = explode("\n", $stderr);
        $erros = [];

        foreach ($linhas as $linha) {
            $linhaTrim = trim($linha);
            if (str_starts_with($linhaTrim, 'ERROR:')) {
                $msg = preg_replace('/^ERROR:\s*(\[[^\]]+\]\s*)?/', '', $linhaTrim) ?? $linhaTrim;
                if (stripos($msg, "Sign in to confirm you're not a bot") !== false || stripos($msg, "confirm you’re not a bot") !== false) {
                    return 'O YouTube exigiu login/autenticação anti-bot para este vídeo (Sign in to confirm you’re not a bot). Forneça o arquivo cookies.txt em var/cookies/youtube.txt.';
                }
                $erros[] = $msg;
            }
        }

        if (!empty($erros)) {
            return implode(' | ', $erros);
        }

        return null;
    }
}
