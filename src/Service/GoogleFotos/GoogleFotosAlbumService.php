<?php

declare(strict_types=1);

namespace App\Service\GoogleFotos;

use App\Entity\Categoria;
use App\Exception\GoogleFotos\GoogleFotosAPIException;
use App\Infra\GoogleFotos\GoogleFotosAPI;
use App\Repository\CategoriaRepository;
use App\Repository\ContaGoogleFotosRepository;

final readonly class GoogleFotosAlbumService
{
    public function __construct(
        private GoogleFotosAPI $googleFotosApi,
        private GoogleFotosOAuthService $oAuthService,
        private ContaGoogleFotosRepository $contaRepository,
        private CategoriaRepository $categoriaRepository,
    ) {}

    public function obterOuCriarAlbumId(Categoria $categoria): string
    {
        $albumIdExistente = $categoria->googleFotosAlbumId();
        if (null !== $albumIdExistente && '' !== trim($albumIdExistente)) {
            return $albumIdExistente;
        }

        $conta = $this->contaRepository->buscarContaAtiva();
        if (null === $conta) {
            throw GoogleFotosAPIException::contaNaoEncontrada();
        }

        $token = $this->oAuthService->obterAccessTokenValido($conta);

        $resultado = $this->googleFotosApi->criarAlbum($token, $categoria->nome());
        $albumId = (string) ($resultado['id'] ?? '');

        if ('' === $albumId) {
            throw GoogleFotosAPIException::falhaCriarAlbum($categoria->nome());
        }

        $categoria->setGoogleFotosAlbumId($albumId);
        $this->categoriaRepository->salvar($categoria);

        return $albumId;
    }
}
