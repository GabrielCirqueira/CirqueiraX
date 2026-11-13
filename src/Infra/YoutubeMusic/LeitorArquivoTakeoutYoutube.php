<?php

declare(strict_types=1);

namespace App\Infra\YoutubeMusic;

use App\DataObject\YoutubeMusic\ItemHistoricoTakeoutYoutubeDTO;
use App\Exception\ImportacaoYoutube\ImportacaoYoutubeException;
use App\Interface\LeitorArquivoTakeoutYoutubeInterface;
use App\Interface\LeitorStreamObjetosJsonInterface;
use DateTimeImmutable;
use DateTimeZone;
use Generator;
use Throwable;
use ZipArchive;

final readonly class LeitorArquivoTakeoutYoutube implements LeitorArquivoTakeoutYoutubeInterface
{
    private const string ASSINATURA_ZIP = "PK\x03\x04";
    private const int TAMANHO_ASSINATURA_ZIP = 4;
    private const string EXTENSAO_JSON = '.json';
    private const int LIMITE_AMOSTRA_DETECCAO = 50;
    private const string CABECALHO_YOUTUBE_MUSIC = 'YouTube Music';
    private const string PADRAO_VIDEO_ID = '/^[A-Za-z0-9_-]{11}$/';
    private const string HOST_LINK_CURTO = 'youtu.be';
    private const string PARAMETRO_VIDEO = 'v';
    private const string PREFIXO_ENDERECO = 'http';
    private const string FUSO_UTC = 'UTC';
    private const array PREFIXOS_TITULO = ['Assistiu ao ', 'Assistiu à ', 'Assistiu a ', 'Assistiu ', 'Watched '];
    private const array CAMPOS_OBRIGATORIOS = ['header', 'title', 'titleUrl', 'time'];
    private const array PREFIXOS_SEM_REPRODUCAO = [
        'Liked ', 'Disliked ', 'Dismissed ', 'Saved ', 'Voted on ', 'Voted ', 'Subscribed to ', 'Searched for ',
        'Viewed ', 'Visited ', 'Answered ', 'Joined ', 'Purchased ', 'Commented on ', 'Shared ',
        'Gostou de ', 'Gostou ', 'Não gostou de ', 'Não gostou ', 'Dispensou ', 'Salvou ', 'Votou em ', 'Votou ',
        'Inscreveu-se em ', 'Inscreveu-se no ', 'Inscreveu-se ', 'Pesquisou por ', 'Pesquisou ', 'Visualizou ',
        'Visitou ', 'Respondeu ', 'Participou ', 'Comprou ', 'Comentou ', 'Compartilhou ',
    ];

    public function __construct(
        private LeitorStreamObjetosJsonInterface $leitorObjetosJson,
    ) {
    }

    public function ler(string $caminhoArquivo): Generator
    {
        if (!is_file($caminhoArquivo) || !is_readable($caminhoArquivo)) {
            throw ImportacaoYoutubeException::arquivoNaoEncontrado();
        }

        if ($this->isZip($caminhoArquivo)) {
            return yield from $this->lerZip($caminhoArquivo);
        }

        return yield from $this->lerJson($caminhoArquivo);
    }

    private function isZip(string $caminhoArquivo): bool
    {
        $ponteiro = fopen($caminhoArquivo, 'rb');
        if (false === $ponteiro) {
            return false;
        }

        $assinatura = fread($ponteiro, self::TAMANHO_ASSINATURA_ZIP);
        fclose($ponteiro);

        return self::ASSINATURA_ZIP === $assinatura;
    }

    /**
     * @return Generator<int, ItemHistoricoTakeoutYoutubeDTO, mixed, int>
     */
    private function lerZip(string $caminhoArquivo): Generator
    {
        $zip = new ZipArchive();
        if (true !== $zip->open($caminhoArquivo)) {
            throw ImportacaoYoutubeException::falhaAoAbrirZip();
        }

        $encontrouHistorico = false;
        $descartados = 0;

        try {
            for ($indice = 0; $indice < $zip->numFiles; ++$indice) {
                $nomeEntrada = $zip->getNameIndex($indice);
                if (false === $nomeEntrada || !str_ends_with(mb_strtolower($nomeEntrada), self::EXTENSAO_JSON)) {
                    continue;
                }

                $amostra = $zip->getStream($nomeEntrada);
                if (false === $amostra) {
                    continue;
                }

                $isHistorico = $this->isHistoricoExibicao($amostra);
                fclose($amostra);

                if (!$isHistorico) {
                    continue;
                }

                $stream = $zip->getStream($nomeEntrada);
                if (false === $stream) {
                    continue;
                }

                $encontrouHistorico = true;

                try {
                    $descartados += yield from $this->lerStream($stream);
                } finally {
                    fclose($stream);
                }
            }
        } finally {
            $zip->close();
        }

        if (!$encontrouHistorico) {
            throw ImportacaoYoutubeException::historicoNaoEncontrado();
        }

        return $descartados;
    }

    /**
     * @return Generator<int, ItemHistoricoTakeoutYoutubeDTO, mixed, int>
     */
    private function lerJson(string $caminhoArquivo): Generator
    {
        $amostra = fopen($caminhoArquivo, 'rb');
        if (false === $amostra) {
            throw ImportacaoYoutubeException::arquivoNaoEncontrado();
        }

        $isHistorico = $this->isHistoricoExibicao($amostra);
        fclose($amostra);

        if (!$isHistorico) {
            throw ImportacaoYoutubeException::historicoNaoEncontrado();
        }

        $stream = fopen($caminhoArquivo, 'rb');
        if (false === $stream) {
            throw ImportacaoYoutubeException::arquivoNaoEncontrado();
        }

        try {
            return yield from $this->lerStream($stream);
        } finally {
            fclose($stream);
        }
    }

    /**
     * @param resource $stream
     */
    private function isHistoricoExibicao($stream): bool
    {
        $analisados = 0;

        foreach ($this->leitorObjetosJson->ler($stream) as $registro) {
            if ($this->temCamposDoHistorico($registro) && !$this->isAnuncio($registro) && !$this->isInteracaoSemReproducao($registro) && null !== $this->extrairVideoId($registro['titleUrl'])) {
                return true;
            }

            if (++$analisados >= self::LIMITE_AMOSTRA_DETECCAO) {
                return false;
            }
        }

        return false;
    }

    /**
     * @param array<string, mixed> $registro
     */
    private function temCamposDoHistorico(array $registro): bool
    {
        foreach (self::CAMPOS_OBRIGATORIOS as $campo) {
            if (!isset($registro[$campo]) || !is_string($registro[$campo])) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param resource $stream
     *
     * @return Generator<int, ItemHistoricoTakeoutYoutubeDTO, mixed, int>
     */
    private function lerStream($stream): Generator
    {
        $descartados = 0;

        foreach ($this->leitorObjetosJson->ler($stream) as $registro) {
            $item = $this->converter($registro);

            if (null === $item) {
                ++$descartados;

                continue;
            }

            yield $item;
        }

        return $descartados;
    }

    /**
     * @param array<string, mixed> $registro
     */
    private function converter(array $registro): ?ItemHistoricoTakeoutYoutubeDTO
    {
        if (!$this->temCamposDoHistorico($registro) || $this->isAnuncio($registro) || $this->isInteracaoSemReproducao($registro)) {
            return null;
        }

        /** @var array{header: string, title: string, titleUrl: string, time: string} $registro */
        $videoId = $this->extrairVideoId($registro['titleUrl']);
        $tocadaEm = $this->converterMomento($registro['time']);

        if (null === $videoId || null === $tocadaEm) {
            return null;
        }

        return new ItemHistoricoTakeoutYoutubeDTO(
            videoId: $videoId,
            titulo: $this->limparTitulo($registro['title']),
            canal: $this->extrairCanal($registro),
            tocadaEm: $tocadaEm,
            youtubeMusic: self::CABECALHO_YOUTUBE_MUSIC === $registro['header'],
        );
    }

    /**
     * @param array<string, mixed> $registro
     */
    private function isAnuncio(array $registro): bool
    {
        return isset($registro['details']) && is_array($registro['details']) && [] !== $registro['details'];
    }

    /**
     * @param array<string, mixed> $registro
     */
    private function isInteracaoSemReproducao(array $registro): bool
    {
        $titulo = is_string($registro['title'] ?? null) ? ltrim($registro['title']) : '';

        foreach (self::PREFIXOS_SEM_REPRODUCAO as $prefixo) {
            if (str_starts_with($titulo, $prefixo)) {
                return true;
            }
        }

        return false;
    }

    private function extrairVideoId(mixed $endereco): ?string
    {
        if (!is_string($endereco)) {
            return null;
        }

        $partes = parse_url($endereco);
        if (false === $partes) {
            return null;
        }

        $candidato = null;
        if (self::HOST_LINK_CURTO === ($partes['host'] ?? null)) {
            $candidato = ltrim($partes['path'] ?? '', '/');
        }

        if (null === $candidato && isset($partes['query'])) {
            parse_str($partes['query'], $parametros);
            $valor = $parametros[self::PARAMETRO_VIDEO] ?? null;
            $candidato = is_string($valor) ? $valor : null;
        }

        return null !== $candidato && 1 === preg_match(self::PADRAO_VIDEO_ID, $candidato) ? $candidato : null;
    }

    private function converterMomento(string $texto): ?DateTimeImmutable
    {
        try {
            return (new DateTimeImmutable($texto))->setTimezone(new DateTimeZone(self::FUSO_UTC));
        } catch (Throwable) {
            return null;
        }
    }

    private function limparTitulo(string $titulo): ?string
    {
        $limpo = trim($titulo);

        foreach (self::PREFIXOS_TITULO as $prefixo) {
            if (str_starts_with($limpo, $prefixo)) {
                $limpo = trim(mb_substr($limpo, mb_strlen($prefixo)));

                break;
            }
        }

        return '' === $limpo || str_starts_with($limpo, self::PREFIXO_ENDERECO) ? null : $limpo;
    }

    /**
     * @param array<string, mixed> $registro
     */
    private function extrairCanal(array $registro): ?string
    {
        $legendas = $registro['subtitles'] ?? null;
        if (!is_array($legendas) || !isset($legendas[0]) || !is_array($legendas[0])) {
            return null;
        }

        $nome = $legendas[0]['name'] ?? null;

        return is_string($nome) && '' !== trim($nome) ? trim($nome) : null;
    }
}
