<?php

declare(strict_types=1);

namespace App\Infra\Lrclib;

use App\DataObject\Pronuncia\LetraEncontradaDTO;
use App\Domain\Pronuncia\LeitorLetraMusica;
use App\Domain\Pronuncia\NormalizadorTituloMusica;
use App\Enum\SituacaoLetraMusica;
use App\Exception\Pronuncia\LetraMusicaException;
use App\Interface\BuscadorLetraMusicaInterface;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\BadResponseException;
use GuzzleHttp\Exception\GuzzleException;

final readonly class LrclibClient implements BuscadorLetraMusicaInterface
{
    private const string URL_BASE = 'https://lrclib.net/api/';
    private const string CAMINHO_EXATO = 'get';
    private const string CAMINHO_BUSCA = 'search';
    private const string AGENTE = 'pronuncia-letras/1.0 (+https://lrclib.net)';
    private const int TIMEOUT_SEGUNDOS = 12;
    private const int CODIGO_NAO_ENCONTRADO = 404;
    private const int MS_POR_SEGUNDO = 1000;
    private const int TOLERANCIA_DURACAO_SEGUNDOS = 4;

    public function __construct(
        private ClientInterface $client,
        private LeitorLetraMusica $leitor,
        private NormalizadorTituloMusica $normalizador,
    ) {
    }

    public function buscar(string $titulo, string $artista, ?string $album, int $duracaoMs): LetraEncontradaDTO
    {
        $duracao = intdiv($duracaoMs + self::MS_POR_SEGUNDO / 2, self::MS_POR_SEGUNDO);
        $parametros = array_filter([
            'track_name' => $titulo,
            'artist_name' => $artista,
            'album_name' => $album,
            'duration' => $duracao > 0 ? $duracao : null,
        ], static fn (mixed $valor): bool => null !== $valor);

        $exata = $this->requisitar(self::CAMINHO_EXATO, $parametros);
        if (null !== $exata && $this->temConteudo($exata)) {
            return $this->converter($exata);
        }

        $candidato = $this->melhorDaBusca($titulo, $artista, $duracao);

        return null === $candidato ? LetraEncontradaDTO::naoEncontrada() : $this->converter($candidato);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function melhorDaBusca(string $titulo, string $artista, int $duracao): ?array
    {
        $resultados = $this->requisitar(self::CAMINHO_BUSCA, [
            'track_name' => $this->normalizador->semSufixos($titulo),
            'artist_name' => $artista,
        ]);

        $candidatos = array_values(array_filter(
            array_is_list($resultados ?? []) ? ($resultados ?? []) : [],
            fn (mixed $item): bool => is_array($item) && $this->temConteudo($item) && $this->duracaoCompativel($item, $duracao),
        ));

        usort($candidatos, fn (array $a, array $b): int => $this->pontuar($b) <=> $this->pontuar($a));

        return $candidatos[0] ?? null;
    }

    /**
     * @param array<mixed> $item
     */
    private function temConteudo(array $item): bool
    {
        return true === ($item['instrumental'] ?? false)
            || $this->textoPreenchido($item['syncedLyrics'] ?? null)
            || $this->textoPreenchido($item['plainLyrics'] ?? null);
    }

    /**
     * @param array<mixed> $item
     */
    private function duracaoCompativel(array $item, int $duracao): bool
    {
        $duracaoItem = $item['duration'] ?? null;
        if ($duracao <= 0 || !is_numeric($duracaoItem)) {
            return true;
        }

        return abs((float) $duracaoItem - $duracao) <= self::TOLERANCIA_DURACAO_SEGUNDOS;
    }

    /**
     * @param array<mixed> $item
     */
    private function pontuar(array $item): int
    {
        return $this->textoPreenchido($item['syncedLyrics'] ?? null) ? 2 : (int) $this->textoPreenchido($item['plainLyrics'] ?? null);
    }

    /**
     * @param array<mixed> $item
     */
    private function converter(array $item): LetraEncontradaDTO
    {
        $sincronizada = $item['syncedLyrics'] ?? null;
        if (is_string($sincronizada) && $this->textoPreenchido($sincronizada)) {
            $linhas = $this->leitor->lerSincronizada($sincronizada);
            if ([] !== $linhas) {
                return new LetraEncontradaDTO(SituacaoLetraMusica::Sincronizada, $linhas);
            }
        }

        $simples = $item['plainLyrics'] ?? null;
        if (is_string($simples) && $this->textoPreenchido($simples)) {
            return new LetraEncontradaDTO(SituacaoLetraMusica::Simples, $this->leitor->lerSimples($simples));
        }

        return true === ($item['instrumental'] ?? false) ? LetraEncontradaDTO::instrumental() : LetraEncontradaDTO::naoEncontrada();
    }

    private function textoPreenchido(mixed $valor): bool
    {
        return is_string($valor) && '' !== trim($valor);
    }

    /**
     * @param array<string, mixed> $parametros
     *
     * @return array<mixed>|null
     */
    private function requisitar(string $caminho, array $parametros): ?array
    {
        try {
            $resposta = $this->client->request('GET', self::URL_BASE.$caminho, [
                'query' => $parametros,
                'headers' => ['User-Agent' => self::AGENTE, 'Accept' => 'application/json'],
                'timeout' => self::TIMEOUT_SEGUNDOS,
            ]);
        } catch (BadResponseException $erro) {
            if (self::CODIGO_NAO_ENCONTRADO === $erro->getResponse()->getStatusCode()) {
                return null;
            }
            throw LetraMusicaException::servicoIndisponivel();
        } catch (GuzzleException) {
            throw LetraMusicaException::servicoIndisponivel();
        }

        try {
            $dados = json_decode((string) $resposta->getBody(), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw LetraMusicaException::servicoIndisponivel();
        }

        return is_array($dados) ? $dados : null;
    }
}
