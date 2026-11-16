<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Musica\ItemHistoricoRecenteDTO;
use App\Entity\ImagemSpotify;
use App\Entity\ReproducaoSpotify;
use App\Entity\Usuario;
use App\Enum\FonteReproducaoMusical;
use App\Repository\ImagemSpotifyRepository;
use App\Repository\ReproducaoSpotifyRepository;

final readonly class ListarHistoricoRecenteSpotifyService
{
    private const LIMITE_PADRAO = 15;
    private const LIMITE_BUSCA = 30;

    public function __construct(
        private ReproducaoSpotifyRepository $reproducaoRepository,
        private ImagemSpotifyRepository $imagemRepository,
    ) {
    }

    /**
     * @return list<ItemHistoricoRecenteDTO>
     */
    public function executar(Usuario $usuario, ?string $excluirCodigoFaixa = null, int $limite = self::LIMITE_PADRAO): array
    {
        $limite = max(1, min($limite, self::LIMITE_PADRAO));
        $reproducoes = $this->reproducaoRepository->listarRecentes($usuario, self::LIMITE_BUSCA);
        $filtradas = $this->excluirAtual($reproducoes, $excluirCodigoFaixa);
        $selecionadas = array_slice($filtradas, 0, $limite);

        $chaves = [];
        foreach ($selecionadas as $reproducao) {
            $chaves[] = ImagemSpotify::gerarChaveFaixa(
                $reproducao->codigoFaixa(),
                $reproducao->artistaPrincipal(),
                $reproducao->nomeFaixa(),
            );
        }
        $imagens = $this->imagemRepository->buscarMapeamentoPorChaves($chaves);

        $itens = [];
        foreach ($selecionadas as $reproducao) {
            $chave = ImagemSpotify::gerarChaveFaixa(
                $reproducao->codigoFaixa(),
                $reproducao->artistaPrincipal(),
                $reproducao->nomeFaixa(),
            );
            $imagem = $imagens[$chave] ?? null;
            $artistas = [$reproducao->artistaPrincipal()];
            foreach ($reproducao->demaisArtistas() ?? [] as $artista) {
                if (is_string($artista) && '' !== trim($artista) && !in_array($artista, $artistas, true)) {
                    $artistas[] = $artista;
                }
            }

            $itens[] = new ItemHistoricoRecenteDTO(
                titulo: $reproducao->nomeFaixa(),
                artistas: array_values($artistas),
                urlCapa: $imagem?->primeiraImagemUrl(),
                urlExterna: ImagemSpotify::gerarUrlSpotifyFaixa(
                    $reproducao->codigoFaixa(),
                    $reproducao->artistaPrincipal(),
                    $reproducao->nomeFaixa(),
                ),
                tocadaEm: $reproducao->tocadaEm(),
                fonte: FonteReproducaoMusical::Spotify->value,
                album: $reproducao->album() !== '' ? $reproducao->album() : null,
                codigoFaixa: $reproducao->codigoFaixa(),
            );
        }

        return $itens;
    }

    /**
     * @param list<ReproducaoSpotify> $reproducoes
     *
     * @return list<ReproducaoSpotify>
     */
    private function excluirAtual(array $reproducoes, ?string $excluirCodigoFaixa): array
    {
        if (null === $excluirCodigoFaixa || '' === trim($excluirCodigoFaixa)) {
            return $reproducoes;
        }

        $codigo = trim($excluirCodigoFaixa);
        $resultado = [];
        $pulouAtual = false;

        foreach ($reproducoes as $reproducao) {
            if (!$pulouAtual && $reproducao->codigoFaixa() === $codigo) {
                $pulouAtual = true;
                continue;
            }
            $resultado[] = $reproducao;
        }

        return $resultado;
    }
}
