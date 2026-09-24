<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Categoria;
use App\Entity\ContaGoogleFotos;
use App\Repository\CategoriaRepository;
use App\Repository\ContaGoogleFotosRepository;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final readonly class GoogleFotosAlbumService
{
    private const GOOGLE_ALBUMS_URL = 'https://photoslibrary.googleapis.com/v1/albums';

    public function __construct(
        private HttpClientInterface $httpClient,
        private GoogleFotosOAuthService $oauthService,
        private ContaGoogleFotosRepository $contaRepository,
        private CategoriaRepository $categoriaRepository,
    ) {
    }

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

        $response = $this->httpClient->request('POST', self::GOOGLE_ALBUMS_URL, [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'album' => [
                    'title' => $categoria->nome(),
                ],
            ],
        ]);

        $dados = $response->toArray();
        $albumId = $dados['id'] ?? null;

        if (empty($albumId) || !is_string($albumId)) {
            throw new \DomainException('erro_criar_album_google', 400);
        }

        $categoria->setGooglePhotosAlbumId($albumId);
        $this->categoriaRepository->salvar($categoria);

        return $albumId;
    }
}
