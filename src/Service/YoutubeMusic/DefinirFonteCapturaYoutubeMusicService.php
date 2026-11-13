<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\Entity\Usuario;
use App\Enum\FonteCapturaYoutubeMusic;
use App\Repository\ContaYoutubeMusicRepository;
use App\Repository\UsuarioRepository;

final readonly class DefinirFonteCapturaYoutubeMusicService
{
    public function __construct(
        private UsuarioRepository $usuarioRepository,
        private ContaYoutubeMusicRepository $contaRepository,
    ) {
    }

    public function executar(Usuario $usuario, FonteCapturaYoutubeMusic $fonte): FonteCapturaYoutubeMusic
    {
        if ($usuario->fonteCapturaYoutubeMusic() === $fonte) {
            return $fonte;
        }

        $conta = $this->contaRepository->buscarDoUsuario($usuario);
        if (null !== $conta && $fonte->isColetor()) {
            $this->contaRepository->salvar($conta->reiniciarReferenciaDoHistorico(), flush: false);
        }

        $this->usuarioRepository->salvar($usuario->definirFonteCapturaYoutubeMusic($fonte));

        return $fonte;
    }
}
