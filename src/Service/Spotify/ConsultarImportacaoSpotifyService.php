<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\Entity\ImportacaoSpotify;
use App\Entity\Usuario;
use App\Exception\Spotify\SpotifyException;
use App\Repository\ImportacaoSpotifyRepository;

final readonly class ConsultarImportacaoSpotifyService
{
    public function __construct(
        private ImportacaoSpotifyRepository $importacaoRepository,
    ) {}

    public function executar(string $uuid, Usuario $usuario): ImportacaoSpotify
    {
        $importacao = $this->importacaoRepository->buscarPorUuidEUsuario($uuid, $usuario);
        if (null === $importacao) {
            throw SpotifyException::importacaoNaoEncontrada();
        }

        return $importacao;
    }
}
