<?php

declare(strict_types=1);

namespace App\Controller\Audio;

use App\Controller\Common\DefaultController;
use App\DataObject\ArquivoMidiaDTO;
use App\DataObject\PaginacaoDTO;
use App\DataObject\SolicitarDownloadAudioDTO;
use App\Entity\Usuario;
use App\Serializer\AudioSerializer;
use App\Service\Audio\ApagarAudioService;
use App\Service\Audio\ConsultarAudiosService;
use App\Service\Audio\SolicitarDownloadAudioService;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/audios', name: 'api_audios_')]
final class AudioController extends DefaultController
{
    private const string NOME_ARQUIVO_ASCII_PADRAO = 'audio.mp3';

    public function __construct(
        private readonly ConsultarAudiosService $consultarAudiosService,
        private readonly SolicitarDownloadAudioService $solicitarDownloadAudioService,
        private readonly ApagarAudioService $apagarAudioService,
        private readonly AudioSerializer $audioSerializer,
    ) {}

    #[Route('', name: 'listar', methods: ['GET'])]
    public function listar(
        #[CurrentUser] Usuario $usuario,
        #[MapQueryString] PaginacaoDTO $paginacao = new PaginacaoDTO(),
    ): Response {
        $pagina = $this->consultarAudiosService->listarDoUsuario($usuario, $paginacao);

        return $this->paginated(
            $this->audioSerializer->normalizarLista($pagina->audios()),
            $pagina->total(),
            $paginacao->pagina(),
            $paginacao->limite(),
        );
    }

    #[Route('', name: 'solicitar', methods: ['POST'])]
    public function solicitar(
        #[CurrentUser] Usuario $usuario,
        #[MapRequestPayload] SolicitarDownloadAudioDTO $dto,
    ): Response {
        $audio = $this->solicitarDownloadAudioService->solicitar($dto, $usuario);

        return $this->created($this->audioSerializer->normalizar($audio));
    }

    #[Route('/{uuid}/rebaixar', name: 'rebaixar', methods: ['POST'])]
    public function rebaixar(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $audio = $this->solicitarDownloadAudioService->rebaixar($uuid, $usuario);

        return $this->success($this->audioSerializer->normalizar($audio));
    }

    #[Route('/{uuid}', name: 'apagar', methods: ['DELETE'])]
    public function apagar(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        $this->apagarAudioService->executar($uuid, $usuario);

        return $this->noContent();
    }

    #[Route('/{uuid}/arquivo', name: 'arquivo', methods: ['GET'])]
    public function baixarArquivo(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        return $this->responderArquivo($this->consultarAudiosService->obterArquivo($uuid, $usuario), ResponseHeaderBag::DISPOSITION_ATTACHMENT);
    }

    #[Route('/{uuid}/stream', name: 'reproduzir', methods: ['GET'])]
    public function reproduzir(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        return $this->responderArquivo($this->consultarAudiosService->obterArquivo($uuid, $usuario), ResponseHeaderBag::DISPOSITION_INLINE);
    }

    private function responderArquivo(ArquivoMidiaDTO $arquivo, string $disposicao): Response
    {
        $resposta = new BinaryFileResponse($arquivo->caminhoFisico());
        $resposta->setAutoEtag();
        $resposta->headers->set('Content-Type', $arquivo->mimeType());
        $resposta->setContentDisposition($disposicao, $arquivo->nomeArquivo(), self::NOME_ARQUIVO_ASCII_PADRAO);

        return $resposta;
    }
}
