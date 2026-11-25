<?php

declare(strict_types=1);

namespace App\Controller\Pronuncia;

use App\Controller\Common\DefaultController;
use App\DataObject\Pronuncia\BuscarLetraMusicaDTO;
use App\Entity\Usuario;
use App\Serializer\PronunciaSerializer;
use App\Service\Pronuncia\ObterLetraMusicaPronunciaService;
use App\Service\Pronuncia\ObterTocandoAgoraPronunciaService;
use App\Service\Pronuncia\TraduzirLetraMusicaService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/pronuncia/musica', name: 'api_pronuncia_musica_')]
final class MusicaPronunciaController extends DefaultController
{
    public function __construct(
        private readonly ObterTocandoAgoraPronunciaService $tocandoAgoraService,
        private readonly ObterLetraMusicaPronunciaService $obterLetraService,
        private readonly TraduzirLetraMusicaService $traduzirLetraService,
        private readonly PronunciaSerializer $serializer,
    ) {
    }

    #[Route('/tocando-agora', name: 'tocando_agora', methods: ['GET'])]
    public function tocandoAgora(#[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->tocandoAgoraService->executar($usuario)->paraArray());
    }

    #[Route('/letra', name: 'letra', methods: ['GET'])]
    public function letra(#[MapQueryString] BuscarLetraMusicaDTO $dto): Response
    {
        return $this->success($this->serializer->serializarLetra($this->obterLetraService->executar($dto)));
    }

    #[Route('/letra/{uuid}/traducao', name: 'traduzir_letra', methods: ['POST'])]
    public function traduzirLetra(string $uuid): Response
    {
        return $this->success($this->serializer->serializarLetra($this->traduzirLetraService->executar($uuid)));
    }
}
