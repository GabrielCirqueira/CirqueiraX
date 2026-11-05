<?php

declare(strict_types=1);

namespace App\Controller\LivroAudio;

use App\Controller\Common\DefaultController;
use App\DataObject\ArquivoMidiaDTO;
use App\Service\LivroAudio\ConsultarLivrosAudioService;
use App\Service\LivroAudio\GerenciarVozesLivroAudioService;
use App\Service\LivroAudio\LinkAssinadoLivroAudioService;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;

#[Route(LinkAssinadoLivroAudioService::PREFIXO, name: 'api_livros_audio_arquivos_')]
final class ArquivoLivroAudioController extends DefaultController
{
    private const string NOME_FALLBACK = 'arquivo';
    private const int CACHE_AUDIO_VERSIONADO_SEGUNDOS = 604800;

    public function __construct(
        private readonly LinkAssinadoLivroAudioService $linkAssinado,
        private readonly ConsultarLivrosAudioService $consultarLivrosAudioService,
        private readonly GerenciarVozesLivroAudioService $gerenciarVozesLivroAudioService,
    ) {}

    #[Route('/vozes/{voz}/amostra', name: 'amostra_voz', methods: ['GET'], priority: 10)]
    public function amostraVoz(string $voz, Request $request): Response
    {
        $this->linkAssinado->validar($request);

        return $this->responderArquivo($this->gerenciarVozesLivroAudioService->obterAmostra($voz));
    }

    #[Route('/{uuid}/pdf', name: 'pdf', methods: ['GET'])]
    public function pdf(string $uuid, Request $request): Response
    {
        $this->linkAssinado->validar($request);
        $livro = $this->linkAssinado->livroDoLink($uuid);

        return $this->responderArquivo($this->consultarLivrosAudioService->obterArquivoPdf($uuid, $livro->usuario()));
    }

    #[Route('/{uuid}/blocos/{numeroBloco}/stream', name: 'stream_bloco', methods: ['GET'])]
    public function streamBloco(string $uuid, int $numeroBloco, Request $request): Response
    {
        $this->linkAssinado->validar($request);
        $livro = $this->linkAssinado->livroDoLink($uuid);
        $arquivo = $this->consultarLivrosAudioService->obterArquivoBloco($uuid, $numeroBloco, $livro->usuario(), $request->query->getString('voz'));
        $resposta = $this->responderArquivo($arquivo);
        $resposta->setPrivate();

        if ($request->query->has('v')) {
            $resposta->setMaxAge(self::CACHE_AUDIO_VERSIONADO_SEGUNDOS);
        }

        return $resposta;
    }

    private function responderArquivo(ArquivoMidiaDTO $arquivo): Response
    {
        $resposta = new BinaryFileResponse($arquivo->caminhoFisico());
        $resposta->setAutoEtag();
        $resposta->headers->set('Content-Type', $arquivo->mimeType());
        $resposta->headers->set('Referrer-Policy', 'no-referrer');
        $resposta->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $arquivo->nomeArquivo(), self::NOME_FALLBACK);

        return $resposta;
    }
}
