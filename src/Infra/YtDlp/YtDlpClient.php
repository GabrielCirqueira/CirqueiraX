<?php

declare(strict_types=1);

namespace App\Infra\YtDlp;

use App\Exception\Video\YtDlpException;
use App\Interface\ExtratorVideoInterface;
use Symfony\Component\Process\Process;

final class YtDlpClient implements ExtratorVideoInterface
{
    private const float TIMEOUT_EXTRACAO_METADATA_SEGUNDOS = 60.0;
    private const float TIMEOUT_DOWNLOAD_VIDEO_SEGUNDOS = 300.0;
    private const string FORMATO_VIDEO_PREFERIDO = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';

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

        $comando = ['yt-dlp', '--dump-json', '--no-playlist'];
        $this->adicionarFlagsPlataforma($comando, $url);
        $comando[] = $url;

        $process = new Process($comando);
        $process->setTimeout(self::TIMEOUT_EXTRACAO_METADATA_SEGUNDOS);
        $process->run();

        if (!$process->isSuccessful()) {
            $motivo = $this->extrairMensagemErroRelevante($process->getErrorOutput());
            throw YtDlpException::falhaAoExtrairMetadataDoVideo($motivo);
        }

        /** @var mixed $dados */
        $dados = json_decode($process->getOutput(), true);
        if (!is_array($dados)) {
            throw YtDlpException::falhaAoProcessarJsonDeMetadata();
        }

        /** @var array<string, mixed> $dados */
        return $dados;
    }

    public function baixarVideo(string $url, string $diretorioDestino): string
    {
        $templateSaida = $diretorioDestino . '/%(id)s.%(ext)s';
        $comando = [
            'yt-dlp',
            '--no-playlist',
            '--no-mtime',
            '--write-info-json',
            '--format',
            self::FORMATO_VIDEO_PREFERIDO,
            '--output',
            $templateSaida,
            '--print',
            'after_move:filepath',
        ];

        $this->adicionarFlagsPlataforma($comando, $url);
        $comando[] = $url;

        $process = new Process($comando);
        $process->setTimeout(self::TIMEOUT_DOWNLOAD_VIDEO_SEGUNDOS);
        $process->run();

        if (!$process->isSuccessful()) {
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
                    $this->metadataCache[$url] = $dados;
                }
            }
        }

        return $caminhoArquivo;
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
                $comando[] = '--extractor-args';
                $comando[] = 'youtube:player_client=web';
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

            $arquivoCookiesTiktok = $this->resolverArquivoCookiesTiktok();
            if (null !== $arquivoCookiesTiktok) {
                $comando[] = '--cookies';
                $comando[] = $arquivoCookiesTiktok;
            }

            return;
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

    private function resolverArquivoCookiesTiktok(): ?string
    {
        $candidatos = [
            $this->projectDir . '/var/cookies/tiktok.txt',
            '/var/www/html/var/cookies/tiktok.txt',
            '/var/www/html/var/storage/cookies/tiktok.txt',
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
