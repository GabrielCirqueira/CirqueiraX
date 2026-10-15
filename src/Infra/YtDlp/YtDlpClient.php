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

    public function __construct(
        private ?string $cookiesPath = null,
        private string $projectDir = '',
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function extrairMetadata(string $url): array
    {
        $comando = ['yt-dlp', '--dump-json', '--no-playlist'];
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
            '--format',
            self::FORMATO_VIDEO_PREFERIDO,
            '--output',
            $templateSaida,
            '--print',
            'after_move:filepath',
        ];

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

        return $caminhoArquivo;
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
