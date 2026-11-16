<?php

declare(strict_types=1);

namespace App\Service\Musica;

use App\DataObject\IdentificacaoMusica\ComponenteIdentificadoDTO;
use App\Entity\MusicaCatalogo;
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
    public function obterMusica(string $titulo, array $artistas, ?string $album = null, ?string $urlCapa = null, ?string $videoOficialId = null): MusicaCatalogo
    {
        $chave = $this->normalizador->chaveMusica($titulo, $artistas[0] ?? '');
        $existente = $this->musicaRepository->buscarPorChave($chave);
        if (null !== $existente && null !== $existente->unidaA()) {
            return $existente->musicaEfetiva();
        }

        $musica = $existente ?? new MusicaCatalogo(trim($titulo), TipoMusicaCatalogo::Original, $chave);
        $this->preferirTituloLimpo($musica, $titulo);

        foreach ($artistas as $nome) {
            $musica->adicionarArtista($this->obterArtista->executar($nome));
        }
        $musica->completarDados($album, $urlCapa, $videoOficialId);
        $this->musicaRepository->salvar($musica);

        return $musica;
    }

    /**
     * @param list<array{componente: ComponenteIdentificadoDTO, musica: MusicaCatalogo}> $partes
     */
    public function obterMashup(array $partes, ?string $urlCapa): MusicaCatalogo
    {
        $chave = $this->normalizador->chaveMashup(array_map(static fn (array $parte): string => $parte['musica']->chaveNormalizada(), $partes));
        $existente = $this->musicaRepository->buscarPorChave($chave);
        if (null !== $existente) {
            return $existente->musicaEfetiva()->completarDados(null, $urlCapa, null);
        }

        $titulo = implode(' + ', array_map(static fn (array $parte): string => $parte['musica']->titulo(), $partes));
        $mashup = new MusicaCatalogo($titulo, TipoMusicaCatalogo::Mashup, $chave);
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

    private function preferirTituloLimpo(MusicaCatalogo $musica, string $titulo): void
    {
        $tituloDaChave = $this->normalizador->tituloDaChave($musica->chaveNormalizada());
        if ($musica->confirmadaManualmente() || $this->normalizador->normalizar($titulo) !== $tituloDaChave || $this->normalizador->normalizar($musica->titulo()) === $tituloDaChave) {
            return;
        }

        $musica->renomear(trim($titulo), $musica->chaveNormalizada());
    }
}
