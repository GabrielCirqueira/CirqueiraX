<?php

declare(strict_types=1);

namespace App\Infra\Spotify;

use App\DataObject\Spotify\ItemHistoricoImportadoDTO;
use App\Enum\FonteReproducaoSpotify;
use App\Exception\Spotify\SpotifyException;
use App\Interface\LeitorArquivoHistoricoSpotifyInterface;
use App\Interface\LeitorStreamObjetosJsonInterface;
use DateTimeImmutable;
use DateTimeZone;
use Generator;
use ZipArchive;

final readonly class LeitorArquivoHistoricoSpotify implements LeitorArquivoHistoricoSpotifyInterface
{
    public function __construct(
        private LeitorStreamObjetosJsonInterface $leitorObjetosJson,
    ) {}

    public function ler(string $caminhoArquivo): Generator
    {
        if (!file_exists($caminhoArquivo) || !is_readable($caminhoArquivo)) {
            throw SpotifyException::arquivoNaoEncontrado($caminhoArquivo);
        }

        if ($this->isArquivoZip($caminhoArquivo)) {
            yield from $this->lerArquivoZip($caminhoArquivo);

            return;
        }

        if ($this->isArquivoJson($caminhoArquivo)) {
            yield from $this->lerArquivoJsonDireto($caminhoArquivo);

            return;
        }

        throw SpotifyException::formatoArquivoHistoricoInvalido();
    }

    private function isArquivoZip(string $caminhoArquivo): bool
    {
        if (str_ends_with(mb_strtolower($caminhoArquivo), '.zip')) {
            return true;
        }

        $ponteiro = @fopen($caminhoArquivo, 'rb');
        if (false === $ponteiro) {
            return false;
        }

        $cabecalho = fread($ponteiro, 4);
        fclose($ponteiro);

        return false !== $cabecalho && str_starts_with($cabecalho, "PK\x03\x04");
    }

    private function isArquivoJson(string $caminhoArquivo): bool
    {
        if (str_ends_with(mb_strtolower($caminhoArquivo), '.json')) {
            return true;
        }

        $ponteiro = @fopen($caminhoArquivo, 'r');
        if (false === $ponteiro) {
            return false;
        }

        $inicio = trim((string) fread($ponteiro, 64));
        fclose($ponteiro);

        return str_starts_with($inicio, '[') || str_starts_with($inicio, '{');
    }

    /**
     * @return Generator<int, ItemHistoricoImportadoDTO>
     */
    private function lerArquivoZip(string $caminhoArquivo): Generator
    {
        $zip = new ZipArchive();
        $resultadoAbertura = $zip->open($caminhoArquivo);

        if (true !== $resultadoAbertura) {
            throw SpotifyException::falhaAoAbrirArquivoZip(sprintf('Código de erro: %s', (string) $resultadoAbertura));
        }

        $encontrouHistorico = false;
        $totalItensEmitidos = 0;

        try {
            $totalArquivos = $zip->numFiles;

            for ($i = 0; $i < $totalArquivos; ++$i) {
                $nomeEntrada = $zip->getNameIndex($i);
                if (false === $nomeEntrada || !$this->isNomeArquivoHistorico($nomeEntrada)) {
                    continue;
                }

                $stream = $zip->getStream($nomeEntrada);
                if (false === $stream) {
                    continue;
                }

                $encontrouHistorico = true;

                try {
                    foreach ($this->processarStreamJson($stream) as $dto) {
                        yield $totalItensEmitidos++ => $dto;
                    }
                } finally {
                    fclose($stream);
                }
            }
        } finally {
            $zip->close();
        }

        if (!$encontrouHistorico) {
            throw SpotifyException::arquivoSemHistoricoStreams();
        }
    }

    /**
     * @return Generator<int, ItemHistoricoImportadoDTO>
     */
    private function lerArquivoJsonDireto(string $caminhoArquivo): Generator
    {
        $stream = @fopen($caminhoArquivo, 'r');
        if (false === $stream) {
            throw SpotifyException::arquivoNaoEncontrado($caminhoArquivo);
        }

        $totalItensEmitidos = 0;
        $encontrouAlgum = false;

        try {
            foreach ($this->processarStreamJson($stream) as $dto) {
                $encontrouAlgum = true;
                yield $totalItensEmitidos++ => $dto;
            }
        } finally {
            fclose($stream);
        }

        if (!$encontrouAlgum) {
            throw SpotifyException::arquivoSemHistoricoStreams();
        }
    }

    private function isNomeArquivoHistorico(string $nomeArquivo): bool
    {
        $nomeBase = basename($nomeArquivo);

        return (bool) preg_match('/^(?:Streaming_?History|endsong|Audio_)[^\/]*\.json$/i', $nomeBase);
    }

    /**
     * @param resource $stream
     *
     * @return Generator<int, ItemHistoricoImportadoDTO>
     */
    private function processarStreamJson($stream): Generator
    {
        foreach ($this->leitorObjetosJson->ler($stream) as $registro) {
            $dto = $this->converterRegistroParaDTO($registro);
            if (null !== $dto) {
                yield $dto;
            }
        }
    }

    /**
     * @param array<string, mixed> $registro
     */
    private function converterRegistroParaDTO(array $registro): ?ItemHistoricoImportadoDTO
    {
        if (isset($registro['ts']) || isset($registro['master_metadata_track_name']) || isset($registro['spotify_track_uri'])) {
            return $this->converterRegistroEstendido($registro);
        }

        if (isset($registro['endTime']) && (isset($registro['trackName']) || isset($registro['artistName']))) {
            return $this->converterRegistroBasico($registro);
        }

        return null;
    }

    /**
     * @param array<string, mixed> $registro
     */
    private function converterRegistroEstendido(array $registro): ?ItemHistoricoImportadoDTO
    {
        $nomeEpisodio = $registro['episode_name'] ?? null;
        $uriEpisodio = $registro['spotify_episode_uri'] ?? null;

        if ((is_string($nomeEpisodio) && '' !== trim($nomeEpisodio)) || (is_string($uriEpisodio) && '' !== trim($uriEpisodio))) {
            return null;
        }

        $nomeFaixaBruto = $registro['master_metadata_track_name'] ?? null;
        $artistaBruto = $registro['master_metadata_album_artist_name'] ?? null;

        if (!is_string($nomeFaixaBruto) || !is_string($artistaBruto)) {
            return null;
        }

        $nomeFaixa = trim($nomeFaixaBruto);
        $artista = trim($artistaBruto);

        if ('' === $nomeFaixa || '' === $artista) {
            return null;
        }

        $msReproduzidos = isset($registro['ms_played']) && is_numeric($registro['ms_played']) ? (int) $registro['ms_played'] : 0;
        if ($msReproduzidos <= 0) {
            return null;
        }

        $albumBruto = $registro['master_metadata_album_album_name'] ?? null;
        $album = is_string($albumBruto) && '' !== trim($albumBruto) ? trim($albumBruto) : null;

        $uriFaixa = $registro['spotify_track_uri'] ?? null;
        $codigoFaixa = null;

        if (is_string($uriFaixa) && str_starts_with($uriFaixa, 'spotify:track:')) {
            $codigoExtraido = substr($uriFaixa, strlen('spotify:track:'));
            $codigoFaixa = '' !== trim($codigoExtraido) ? trim($codigoExtraido) : null;
        }

        $tsBruto = $registro['ts'] ?? null;
        if (!is_string($tsBruto) || '' === trim($tsBruto)) {
            return null;
        }

        try {
            $tocadaEm = new DateTimeImmutable(trim($tsBruto));
        } catch (\Throwable) {
            return null;
        }

        return new ItemHistoricoImportadoDTO(
            codigoFaixa: $codigoFaixa,
            nomeFaixa: $nomeFaixa,
            artistaPrincipal: $artista,
            album: $album,
            msReproduzidos: $msReproduzidos,
            tocadaEm: $tocadaEm,
            fonte: FonteReproducaoSpotify::ImportacaoEstendida,
            pulada: $this->extrairBooleano($registro['skipped'] ?? null),
            aleatorio: $this->extrairBooleano($registro['shuffle'] ?? null),
        );
    }

    /**
     * @param array<string, mixed> $registro
     */
    private function converterRegistroBasico(array $registro): ?ItemHistoricoImportadoDTO
    {
        $nomeFaixaBruto = $registro['trackName'] ?? null;
        $artistaBruto = $registro['artistName'] ?? null;

        if (!is_string($nomeFaixaBruto) || !is_string($artistaBruto)) {
            return null;
        }

        $nomeFaixa = trim($nomeFaixaBruto);
        $artista = trim($artistaBruto);

        if ('' === $nomeFaixa || '' === $artista) {
            return null;
        }

        $msReproduzidos = isset($registro['msPlayed']) && is_numeric($registro['msPlayed']) ? (int) $registro['msPlayed'] : 0;
        if ($msReproduzidos <= 0) {
            return null;
        }

        $endTimeBruto = $registro['endTime'] ?? null;
        if (!is_string($endTimeBruto) || '' === trim($endTimeBruto)) {
            return null;
        }

        $fusoUtc = new DateTimeZone('UTC');
        $endTimeTexto = trim($endTimeBruto);

        $tocadaEm = DateTimeImmutable::createFromFormat('Y-m-d H:i', $endTimeTexto, $fusoUtc);
        if (false === $tocadaEm) {
            $tocadaEm = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $endTimeTexto, $fusoUtc);
        }
        if (false === $tocadaEm) {
            try {
                $tocadaEm = new DateTimeImmutable($endTimeTexto, $fusoUtc);
            } catch (\Throwable) {
                return null;
            }
        }

        return new ItemHistoricoImportadoDTO(
            codigoFaixa: null,
            nomeFaixa: $nomeFaixa,
            artistaPrincipal: $artista,
            album: null,
            msReproduzidos: $msReproduzidos,
            tocadaEm: $tocadaEm,
            fonte: FonteReproducaoSpotify::ImportacaoBasica,
        );
    }

    private function extrairBooleano(mixed $valor): ?bool
    {
        if (is_bool($valor)) {
            return $valor;
        }

        if (1 === $valor || 0 === $valor) {
            return 1 === $valor;
        }

        return null;
    }
}
