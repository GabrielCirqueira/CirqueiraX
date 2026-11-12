<?php

declare(strict_types=1);

namespace App\Service\Musica;

use App\Entity\ImagemSpotify;
use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Service\Spotify\EnriquecerImagensSpotifyService;

final readonly class MontarMidiaSugestoesRevisaoService
{
    private const int PRIORIDADE_IMAGENS = 2;
    private const array CAMPOS_LEITURAS = ['componentes', 'alternativas'];

    public function __construct(
        private EnriquecerImagensSpotifyService $enriquecerImagens,
    ) {
    }

    /**
     * @param list<VideoYoutube> $videos
     *
     * @return array<string, list<array{titulo: string, artista: string, urlCapa: string|null, urlSpotify: string}>>
     */
    public function executar(Usuario $usuario, array $videos): array
    {
        $leiturasPorVideo = [];
        $faixas = [];
        foreach ($videos as $video) {
            $leituras = $this->extrairLeituras($video);
            $leiturasPorVideo[$video->uuid()->toRfc4122()] = $leituras;
            foreach ($leituras as $leitura) {
                $faixas[ImagemSpotify::gerarChaveFaixa(null, $leitura['artista'], $leitura['titulo'])] = ['codigo' => null, 'nome' => $leitura['titulo'], 'artista' => $leitura['artista']];
            }
        }

        if ([] === $faixas) {
            return [];
        }

        $mapa = $this->enriquecerImagens->enriquecerEAgendar(
            usuario: $usuario,
            faixas: array_values($faixas),
            artistas: [],
            prioridade: self::PRIORIDADE_IMAGENS,
        );

        return array_map(static fn (array $leituras): array => array_map(static function (array $leitura) use ($mapa): array {
            $chave = ImagemSpotify::gerarChaveFaixa(null, $leitura['artista'], $leitura['titulo']);
            $busca = ImagemSpotify::gerarUrlSpotifyFaixa(null, $leitura['artista'], $leitura['titulo']);

            return [
                ...$leitura,
                'urlCapa' => $mapa->obterImagem($chave),
                'urlSpotify' => $mapa->obterUrlSpotify($chave) ?? $busca,
            ];
        }, $leituras), $leiturasPorVideo);
    }

    /**
     * @return list<array{titulo: string, artista: string}>
     */
    private function extrairLeituras(VideoYoutube $video): array
    {
        $resposta = $video->respostaIa() ?? [];
        $leituras = [];
        foreach (self::CAMPOS_LEITURAS as $campo) {
            $itens = is_array($resposta[$campo] ?? null) ? $resposta[$campo] : [];
            foreach ($itens as $item) {
                $titulo = is_array($item) && is_string($item['titulo'] ?? null) ? trim($item['titulo']) : '';
                $artistas = is_array($item) && is_array($item['artistas'] ?? null) ? $item['artistas'] : [];
                $artista = is_string($artistas[0] ?? null) ? trim($artistas[0]) : '';
                if ('' === $titulo || '' === $artista) {
                    continue;
                }
                $leituras[] = ['titulo' => $titulo, 'artista' => $artista];
            }
        }

        return $leituras;
    }
}
