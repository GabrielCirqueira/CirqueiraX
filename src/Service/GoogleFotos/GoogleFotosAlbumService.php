<?php

declare(strict_types=1);

namespace App\Service\GoogleFotos;

use App\Entity\Categoria;
use App\Entity\ContaGoogleFotos;
use App\Exception\GoogleFotos\GoogleFotosAPIException;
use App\Infra\GoogleFotos\GoogleFotosAPI;
use App\Repository\CategoriaRepository;
use App\Repository\ContaGoogleFotosRepository;
use Psr\Log\LoggerInterface;

final readonly class GoogleFotosAlbumService
{
    public function __construct(
        private GoogleFotosAPI $googleFotosApi,
        private GoogleFotosOAuthService $oAuthService,
        private ContaGoogleFotosRepository $contaRepository,
        private CategoriaRepository $categoriaRepository,
        private LoggerInterface $logger,
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

        $this->logger->warning(sprintf('Álbum criado automaticamente no Google Fotos para a categoria "%s" com ID "%s".', $categoria->nome(), $albumId), [
            'categoria' => $categoria->nome(),
            'categoriaUuid' => (string) $categoria->uuid(),
            'albumId' => $albumId,
        ]);

        $categoria->setGoogleFotosAlbumId($albumId);
        $this->categoriaRepository->salvar($categoria);

        return $albumId;
    }

    /**
     * @return array<int, array{id: string, titulo: string, urlCapa: ?string, totalItens: int}>
     */
    public function listarAlbunsDoApp(ContaGoogleFotos $conta): array
    {
        $token = $this->oAuthService->obterAccessTokenValido($conta);
        $albuns = [];
        $nextPageToken = null;

        do {
            $resposta = $this->googleFotosApi->listarAlbuns($token, $nextPageToken);
            $lista = $resposta['albums'] ?? [];

            if (is_array($lista)) {
                foreach ($lista as $item) {
                    if (!is_array($item) || empty($item['id'])) {
                        continue;
                    }

                    $albuns[] = [
                        'id' => (string) $item['id'],
                        'titulo' => (string) ($item['title'] ?? ''),
                        'urlCapa' => isset($item['coverPhotoBaseUrl']) && is_string($item['coverPhotoBaseUrl']) ? $item['coverPhotoBaseUrl'] : null,
                        'totalItens' => isset($item['mediaItemsCount']) ? (int) $item['mediaItemsCount'] : 0,
                    ];
                }
            }

            $nextPageToken = isset($resposta['nextPageToken']) && is_string($resposta['nextPageToken']) && '' !== trim($resposta['nextPageToken'])
                ? $resposta['nextPageToken']
                : null;
        } while (null !== $nextPageToken);

        return $albuns;
    }
}
