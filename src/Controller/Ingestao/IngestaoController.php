<?php

declare(strict_types=1);

namespace App\Controller\Ingestao;

use App\Controller\Common\DefaultController;
use App\DataObject\IngestarPrintDTO;
use App\Security\AgenteUser;
use App\Serializer\MediaItemSerializer;
use App\Service\Ingestao\IngestarPrintService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/v1/ingestao', name: 'api_ingestao_')]
final class IngestaoController extends DefaultController
{
    public function __construct(
        private readonly IngestarPrintService $ingestarPrintService,
        private readonly MediaItemSerializer $mediaItemSerializer,
    ) {}

    #[Route('/print', name: 'print', methods: ['POST'])]
    #[IsGranted('ROLE_AGENTE')]
    public function ingestarPrint(
        Request $request,
        ValidatorInterface $validator,
        #[CurrentUser] AgenteUser $agenteUser,
    ): Response {
        $dto = IngestarPrintDTO::fromRequest($request);
        $violacoes = $validator->validate($dto);

        if (count($violacoes) > 0) {
            $detalhes = [];
            foreach ($violacoes as $violacao) {
                $detalhes[$violacao->getPropertyPath()] = (string) $violacao->getMessage();
            }

            return $this->unprocessable('dados_invalidos', $detalhes);
        }

        $tokenAgente = $agenteUser->tokenAgente();
        $mediaItem = $this->ingestarPrintService->executar($dto, $tokenAgente);

        return $this->created($this->mediaItemSerializer->normalizar($mediaItem));
    }
}
