<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Categoria;
use App\Entity\ContaGoogleFotos;
use App\Infra\GoogleFotos\GoogleFotosAPI;
use App\Repository\CategoriaRepository;
use App\Repository\ContaGoogleFotosRepository;

final readonly class GoogleFotosAlbumService
{
    public function __construct(
        private GoogleFotosAPI $googleFotosApi,
        private GoogleFotosOAuthService $oauthService,
        private ContaGoogleFotosRepository $contaRepository,
        private CategoriaRepository $categoriaRepository,
    ) {}

    public function criarOuObter(Categoria $categoria, ?ContaGoogleFotos $conta = null): string
    {
        $albumIdExistente = $categoria->googlePhotosAlbumId();
        if (null !== $albumIdExistente && '' !== trim($albumIdExistente)) {
            return $albumIdExistente;
        }

        if (null === $conta) {
            $conta = $this->contaRepository->buscarContaPrincipal();
        }

        if (null === $conta) {
            throw new \DomainException('conta_google_fotos_nao_encontrada', 404);
        }

        $token = $this->oauthService->obterAccessTokenValido($conta);
        $dados = $this->googleFotosApi->criarAlbum($token, $categoria->nome());

        $albumId = $dados['id'] ?? null;
        if (empty($albumId) || !is_string($albumId)) {
            throw new \DomainException('erro_criar_album_google', 400);
        }

        $categoria->setGooglePhotosAlbumId($albumId);
        $this->categoriaRepository->salvar($categoria);

        return $albumId;
    }
}
