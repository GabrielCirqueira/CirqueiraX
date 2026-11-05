<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\Spotify\ArtistaSpotifyDTO;
use App\DataObject\Spotify\BuscaFaixasSpotifyDTO;
use App\DataObject\Spotify\FaixaSpotifyDTO;
use App\DataObject\Spotify\ListaReproducoesRecentesSpotifyDTO;
use App\DataObject\Spotify\PerfilSpotifyDTO;
use App\DataObject\Spotify\TokensSpotifyDTO;

interface SpotifyInterface
{
    /**
     * @param array<int, string> $escopos
     */
    public function gerarUrlAutorizacao(string $state, array $escopos): string;

    public function trocarCodigoPorTokens(string $code): TokensSpotifyDTO;

    public function renovarToken(string $refreshToken): TokensSpotifyDTO;

    public function buscarPerfil(string $accessToken): PerfilSpotifyDTO;

    public function listarReproducoesRecentes(string $accessToken, ?int $depoisDe = null, int $limite = 50): ListaReproducoesRecentesSpotifyDTO;

    public function obterFaixa(string $accessToken, string $idFaixa): FaixaSpotifyDTO;

    public function obterArtista(string $accessToken, string $idArtista): ArtistaSpotifyDTO;

    public function buscarFaixas(string $accessToken, string $texto, int $limite = 10): BuscaFaixasSpotifyDTO;
}
