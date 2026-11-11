<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\Entity\Usuario;
use App\Exception\Musica\AnaliseMusicaException;
use App\Repository\AliasArtistaCatalogoRepository;
use App\Repository\ArtistaCatalogoRepository;
use App\Repository\VinculoMusicaSpotifyRepository;
use App\Service\Musica\NormalizarTextoMusicaService;

final readonly class ResolverAlvoPorNomeService
{
    public function __construct(
        private ArtistaCatalogoRepository $artistaRepository,
        private AliasArtistaCatalogoRepository $aliasRepository,
        private VinculoMusicaSpotifyRepository $vinculoRepository,
        private NormalizarTextoMusicaService $normalizador,
    ) {}

    public function resolverArtista(Usuario $usuario, string $nome): string
    {
        $normalizado = $this->normalizador->normalizar($nome);
        $artista = $this->aliasRepository->buscarPorAlias($usuario, $normalizado)?->artista()
            ?? $this->artistaRepository->buscarPorNomeNormalizado($usuario, $normalizado)
            ?? throw AnaliseMusicaException::naoEncontradaNoCatalogo();

        return $artista->artistaEfetivo()->uuid()->toRfc4122();
    }

    public function resolverMusica(Usuario $usuario, string $nome, string $artista): string
    {
        $vinculo = $this->vinculoRepository->buscarPorIdentidade(
            $usuario,
            $this->normalizador->normalizar($nome),
            $this->normalizador->normalizar($artista),
        ) ?? throw AnaliseMusicaException::naoEncontradaNoCatalogo();

        return $vinculo->musica()->musicaEfetiva()->uuid()->toRfc4122();
    }
}
