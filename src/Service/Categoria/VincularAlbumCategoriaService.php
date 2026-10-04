<?php

declare(strict_types=1);

namespace App\Service\Categoria;

use App\DataObject\VincularAlbumDTO;
use App\Entity\Categoria;
use App\Exception\Categoria\CategoriaException;
use App\Exception\GoogleFotos\GoogleFotosAPIException;
use App\Repository\CategoriaRepository;
use App\Repository\ContaGoogleFotosRepository;
use App\Service\GoogleFotos\GoogleFotosAlbumService;
use Symfony\Component\Uid\Uuid;

final readonly class VincularAlbumCategoriaService
{
    public function __construct(
        private CategoriaRepository $categoriaRepository,
        private ContaGoogleFotosRepository $contaRepository,
        private GoogleFotosAlbumService $albumService,
    ) {}

    public function executar(string|Uuid $categoriaUuid, VincularAlbumDTO $dto): Categoria
    {
        $categoria = $this->categoriaRepository->buscarPorUuid($categoriaUuid);
        if (null === $categoria) {
            throw CategoriaException::categoriaNaoEncontrada();
        }

        $conta = $this->contaRepository->buscarContaAtiva();
        if (null === $conta) {
            throw GoogleFotosAPIException::contaNaoEncontrada();
        }

        $albumIdAlvo = trim($dto->googlePhotosAlbumId());
        $albuns = $this->albumService->listarAlbunsDoApp($conta);

        $albumExiste = false;
        foreach ($albuns as $album) {
            if ($album['id'] === $albumIdAlvo) {
                $albumExiste = true;
                break;
            }
        }

        if (!$albumExiste) {
            throw CategoriaException::albumNaoEncontradoNoGoogle($albumIdAlvo);
        }

        $categoria->setGoogleFotosAlbumId($albumIdAlvo);
        $this->categoriaRepository->salvar($categoria);

        return $categoria;
    }
}
