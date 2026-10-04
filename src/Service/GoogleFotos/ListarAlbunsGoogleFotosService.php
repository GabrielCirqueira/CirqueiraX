<?php

declare(strict_types=1);

namespace App\Service\GoogleFotos;

use App\Exception\GoogleFotos\GoogleFotosAPIException;
use App\Repository\ContaGoogleFotosRepository;

final readonly class ListarAlbunsGoogleFotosService
{
    public function __construct(
        private ContaGoogleFotosRepository $contaRepository,
        private GoogleFotosAlbumService $albumService,
    ) {}

    /**
     * @return array<int, array{id: string, titulo: string, urlCapa: ?string, totalItens: int}>
     */
    public function listar(): array
    {
        $conta = $this->contaRepository->buscarContaAtiva();
        if (null === $conta) {
            throw GoogleFotosAPIException::contaNaoEncontrada();
        }

        return $this->albumService->listarAlbunsDoApp($conta);
    }
}
