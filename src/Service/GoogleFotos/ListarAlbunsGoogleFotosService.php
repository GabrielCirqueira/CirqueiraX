<?php

declare(strict_types=1);

namespace App\Service\GoogleFotos;

use App\Exception\GoogleFotos\GoogleFotosAPIException;
use App\Repository\CategoriaRepository;
use App\Repository\ContaGoogleFotosRepository;

final readonly class ListarAlbunsGoogleFotosService
{
    public function __construct(
        private ContaGoogleFotosRepository $contaRepository,
        private CategoriaRepository $categoriaRepository,
        private GoogleFotosAlbumService $albumService,
    ) {}

    /**
     * @return array{
     *     albuns: array<int, array{
     *         id: string,
     *         titulo: string,
     *         urlCapa: ?string,
     *         totalItens: int,
     *         vinculado: bool,
     *         categoria: ?array{uuid: string, nome: string, pastaLocal: string}
     *     }>,
     *     categoriasSemAlbum: array<int, array{uuid: string, nome: string, pastaLocal: string}>,
     *     resumo: array{totalAlbuns: int, totalVinculados: int, totalOrfaos: int, totalCategoriasSemAlbum: int}
     * }
     */
    public function listar(): array
    {
        $conta = $this->contaRepository->buscarContaAtiva();
        if (null === $conta) {
            throw GoogleFotosAPIException::contaNaoEncontrada();
        }

        $categorias = $this->categoriaRepository->listarTodas();
        $categoriasPorAlbumId = [];
        $categoriasSemAlbum = [];

        foreach ($categorias as $cat) {
            $albumId = $cat->googleFotosAlbumId();
            $catData = [
                'uuid' => $cat->uuid()?->toString() ?? '',
                'nome' => $cat->nome(),
                'pastaLocal' => $cat->pastaLocal(),
            ];

            if (null !== $albumId && '' !== trim($albumId)) {
                $categoriasPorAlbumId[trim($albumId)] = $catData;
            } else {
                $categoriasSemAlbum[] = $catData;
            }
        }

        $albunsBrutos = $this->albumService->listarAlbunsDoApp($conta);
        $albunsEnriquecidos = [];
        $totalVinculados = 0;
        $totalOrfaos = 0;

        foreach ($albunsBrutos as $album) {
            $id = $album['id'];
            $categoriaVinculada = $categoriasPorAlbumId[$id] ?? null;
            $estaVinculado = null !== $categoriaVinculada;

            if ($estaVinculado) {
                $totalVinculados++;
            } else {
                $totalOrfaos++;
            }

            $albunsEnriquecidos[] = [
                'id' => $id,
                'titulo' => $album['titulo'],
                'urlCapa' => $album['urlCapa'],
                'totalItens' => $album['totalItens'],
                'vinculado' => $estaVinculado,
                'categoria' => $categoriaVinculada,
            ];
        }

        return [
            'albuns' => $albunsEnriquecidos,
            'categoriasSemAlbum' => $categoriasSemAlbum,
            'resumo' => [
                'totalAlbuns' => count($albunsEnriquecidos),
                'totalVinculados' => $totalVinculados,
                'totalOrfaos' => $totalOrfaos,
                'totalCategoriasSemAlbum' => count($categoriasSemAlbum),
            ],
        ];
    }
}
