<?php

declare(strict_types=1);

namespace App\Service\Musica;

use App\DataObject\IdentificacaoMusica\ComponenteIdentificadoDTO;
use App\Entity\MusicaCatalogo;
use App\Entity\Usuario;
use App\Enum\TipoMusicaCatalogo;
use App\Repository\MusicaCatalogoRepository;

final readonly class ObterMusicaCatalogoService
{
    public function __construct(
        private MusicaCatalogoRepository $musicaRepository,
        private ObterArtistaCatalogoService $obterArtista,
        private NormalizarTextoMusicaService $normalizador,
    ) {
    }

    /**
     * @param list<string> $artistas
     */
    public function obterMusica(Usuario $usuario, string $titulo, array $artistas, ?string $album = null, ?string $urlCapa = null, ?string $videoOficialId = null): MusicaCatalogo
    {
        $chave = $this->normalizador->chaveMusica($titulo, $artistas[0] ?? '');
        $musica = $this->musicaRepository->buscarPorChave($usuario, $chave) ?? new MusicaCatalogo($usuario, trim($titulo), TipoMusicaCatalogo::Original, $chave);

        foreach ($artistas as $nome) {
            $musica->adicionarArtista($this->obterArtista->executar($usuario, $nome));
        }
        $musica->completarDados($album, $urlCapa, $videoOficialId);
        $this->musicaRepository->salvar($musica);

        return $musica;
    }

    /**
     * @param list<array{componente: ComponenteIdentificadoDTO, musica: MusicaCatalogo}> $partes
     */
    public function obterMashup(Usuario $usuario, array $partes, ?string $urlCapa): MusicaCatalogo
    {
        $chave = $this->normalizador->chaveMashup(array_map(static fn (array $parte): string => $parte['musica']->chaveNormalizada(), $partes));
        $existente = $this->musicaRepository->buscarPorChave($usuario, $chave);
        if (null !== $existente) {
            return $existente->completarDados(null, $urlCapa, null);
        }

        $titulo = implode(' + ', array_map(static fn (array $parte): string => $parte['musica']->titulo(), $partes));
        $mashup = new MusicaCatalogo($usuario, $titulo, TipoMusicaCatalogo::Mashup, $chave);
        foreach ($partes as $parte) {
            $mashup->adicionarComponente($parte['componente']->titulo, $parte['musica']);
            foreach ($parte['musica']->artistas() as $artista) {
                $mashup->adicionarArtista($artista);
            }
        }
        $mashup->completarDados(null, $urlCapa, null);
        $this->musicaRepository->salvar($mashup);

        return $mashup;
    }
}
