<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Extensao;

use App\DataObject\YoutubeMusic\GerarTokenExtensaoYoutubeDTO;
use App\DataObject\YoutubeMusic\TokenExtensaoGeradoDTO;
use App\Entity\TokenExtensaoYoutubeMusic;
use App\Entity\Usuario;
use App\Exception\YoutubeMusic\ExtensaoYoutubeMusicException;
use App\Repository\TokenExtensaoYoutubeMusicRepository;

final readonly class GerarTokenExtensaoYoutubeService
{
    public const int LIMITE_APARELHOS_ATIVOS = 5;
    private const int BYTES_TOKEN = 32;
    private const string PREFIXO_TOKEN = 'cxyt_';
    private const string ALGORITMO_HASH = 'sha256';

    public function __construct(
        private TokenExtensaoYoutubeMusicRepository $tokenRepository,
    ) {
    }

    public function executar(Usuario $usuario, GerarTokenExtensaoYoutubeDTO $dto): TokenExtensaoGeradoDTO
    {
        if ($this->tokenRepository->contarAtivosDoUsuario($usuario) >= self::LIMITE_APARELHOS_ATIVOS) {
            throw ExtensaoYoutubeMusicException::limiteDeAparelhos(self::LIMITE_APARELHOS_ATIVOS);
        }

        $textoToken = self::PREFIXO_TOKEN.bin2hex(random_bytes(self::BYTES_TOKEN));
        $token = new TokenExtensaoYoutubeMusic($usuario, $dto->nomeAparelho, hash(self::ALGORITMO_HASH, $textoToken));
        $this->tokenRepository->salvar($token);

        return new TokenExtensaoGeradoDTO($token, $textoToken);
    }
}
