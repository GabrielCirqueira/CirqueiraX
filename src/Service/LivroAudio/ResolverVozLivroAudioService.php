<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\Entity\LivroAudio;
use App\Infra\Audio\EdgeTtsClient;
use App\Repository\LivroAudioBlocoRepository;

final readonly class ResolverVozLivroAudioService
{
    public function __construct(
        private LivroAudioBlocoRepository $livroAudioBlocoRepository,
    ) {}

    public function vozPrincipal(LivroAudio $livro): string
    {
        foreach ($this->livroAudioBlocoRepository->listarPorLivro($livro) as $bloco) {
            $voz = $bloco->voz();
            if (null !== $voz) {
                return $voz;
            }
        }

        return $livro->idioma()?->voz() ?? EdgeTtsClient::VOZ_PADRAO;
    }

    public function diretorioVoz(LivroAudio $livro, string $voz): string
    {
        $caminhoPdf = $livro->caminhoPdf();
        $diretorioLivro = null !== $caminhoPdf ? dirname($caminhoPdf) : sprintf('/var/www/html/var/livros/%s', $livro->uuidTexto());

        return sprintf('%s/blocos/vozes/%s', $diretorioLivro, $voz);
    }
}
