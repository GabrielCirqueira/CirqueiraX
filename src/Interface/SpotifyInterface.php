<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\Spotify\ArtistaSpotifyDTO;
use App\DataObject\Spotify\BuscaFaixasSpotifyDTO;
use App\DataObject\Spotify\FaixaSpotifyDTO;
use App\DataObject\Spotify\ListaReproducoesRecentesSpotifyDTO;
use App\DataObject\Spotify\PerfilSpotifyDTO;
use App\DataObject\Spotify\TocandoAgoraSpotifyDTO;
use App\DataObject\Spotify\TokensSpotifyDTO;

interface SpotifyInterface
{
    /**
     * @param array<int, string> $escopos
     */
    public function gerarUrlAutorizacao(string $state, array $escopos): string;

    public function trocarCodigoPorTokens(string $code): TokensSpotifyDTO;

    public function renovarToken(string $refreshToken): TokensSpotifyDTO;

    public function obterTokenClientCredentials(): string;

    public function buscarPerfil(string $accessToken): PerfilSpotifyDTO;

    public function listarReproducoesRecentes(string $accessToken, ?int $depoisDe = null, int $limite = 50): ListaReproducoesRecentesSpotifyDTO;

    public function obterTocandoAgora(string $accessToken): TocandoAgoraSpotifyDTO;

    public function obterFaixa(string $accessToken, string $idFaixa): FaixaSpotifyDTO;

    /**
     * @param list<string> $uris
     */
    public function tocarNoDispositivo(string $accessToken, string $codigoDispositivo, array $uris): void;

    public function obterArtista(string $accessToken, string $idArtista): ArtistaSpotifyDTO;

    /**
     * @return array<int, ArtistaSpotifyDTO>
     */
    public function buscarArtistas(string $accessToken, string $nome, int $limite = 5): array;

    public function buscarFaixas(string $accessToken, string $texto, int $limite = 10): BuscaFaixasSpotifyDTO;
}
