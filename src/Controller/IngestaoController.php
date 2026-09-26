<?php

declare(strict_types=1);

namespace App\Controller;

use App\DataObject\IngestarPrintDTO;
use App\Security\AgenteUser;
use App\Serializer\MediaItemSerializer;
use App\Service\IngestarPrintService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class IngestaoController extends DefaultController
{
    public function __construct(
        private readonly ValidatorInterface $validator,
        private readonly IngestarPrintService $ingestarPrintService,
        private readonly MediaItemSerializer $mediaItemSerializer,
    ) {
    }

    #[Route('/api/v1/ingestao/print', name: 'api_ingestao_print', methods: ['POST'])]
    #[IsGranted('ROLE_AGENTE')]
    public function ingestarPrint(
        Request $request,
        #[CurrentUser]
        ?AgenteUser $agenteUser,
    ): Response {
        if (null === $agenteUser) {
            return $this->unauthorized('agente_nao_autenticado');
        }

        $dto = IngestarPrintDTO::fromRequest($request);
        $violacoes = $this->validator->validate($dto);

        if (count($violacoes) > 0) {
            $detalhes = [];
            foreach ($violacoes as $violacao) {
                $detalhes[$violacao->getPropertyPath()] = (string) $violacao->getMessage();
            }

            return $this->unprocessable('dados_invalidos', $detalhes);
        }

        $mediaItem = $this->ingestarPrintService->executar($dto, $agenteUser->tokenAgente());

        return $this->created($this->mediaItemSerializer->normalizar($mediaItem));
    }
}
