<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\DataObject\Musica\ItemHistoricoRecenteDTO;
use App\Entity\ArtistaCatalogo;
use App\Entity\ReproducaoYoutube;
use App\Entity\Usuario;
use App\Enum\FonteReproducaoMusical;
use App\Repository\ReproducaoYoutubeRepository;

final readonly class ListarHistoricoRecenteYoutubeService
{
    private const LIMITE_PADRAO = 15;
    private const LIMITE_BUSCA = 30;
    private const URL_VIDEO = 'https://music.youtube.com/watch?v=';

    public function __construct(
        private ReproducaoYoutubeRepository $reproducaoRepository,
    ) {
    }

    /**
     * @return list<ItemHistoricoRecenteDTO>
     */
    public function executar(Usuario $usuario, ?string $excluirVideoId = null, int $limite = self::LIMITE_PADRAO): array
    {
        $limite = max(1, min($limite, self::LIMITE_PADRAO));
        $reproducoes = $this->reproducaoRepository->listarRecentes($usuario, self::LIMITE_BUSCA);
        $filtradas = $this->excluirAtual($reproducoes, $excluirVideoId);
        $selecionadas = array_slice($filtradas, 0, $limite);

        $itens = [];
        foreach ($selecionadas as $reproducao) {
            $video = $reproducao->video();
            $musica = $video->musica()?->musicaEfetiva();
            $artistas = null === $musica
                ? array_values(array_filter([$video->canal()]))
                : array_map(static fn (ArtistaCatalogo $artista): string => $artista->nome(), $musica->artistas());

            if ([] === $artistas) {
                $artistas = array_values(array_filter([$video->canal()]));
            }

            $itens[] = new ItemHistoricoRecenteDTO(
                titulo: $musica?->titulo() ?? $video->titulo(),
                artistas: $artistas,
                urlCapa: $musica?->urlCapa() ?? $video->urlCapa(),
                urlExterna: self::URL_VIDEO . $video->videoId(),
                tocadaEm: $reproducao->tocadaEm(),
                fonte: FonteReproducaoMusical::YoutubeMusic->value,
                album: $musica?->album(),
                videoId: $video->videoId(),
                identificada: null !== $musica,
            );
        }

        return $itens;
    }

    /**
     * @param list<ReproducaoYoutube> $reproducoes
     *
     * @return list<ReproducaoYoutube>
     */
    private function excluirAtual(array $reproducoes, ?string $excluirVideoId): array
    {
        if (null === $excluirVideoId || '' === trim($excluirVideoId)) {
            return $reproducoes;
        }

        $videoId = trim($excluirVideoId);
        $resultado = [];
        $pulouAtual = false;

        foreach ($reproducoes as $reproducao) {
            if (!$pulouAtual && $reproducao->video()->videoId() === $videoId) {
                $pulouAtual = true;
                continue;
            }
            $resultado[] = $reproducao;
        }

        return $resultado;
    }
}
