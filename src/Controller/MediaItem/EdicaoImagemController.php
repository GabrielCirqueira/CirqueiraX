<?php

declare(strict_types=1);

namespace App\Controller\MediaItem;

use App\Controller\Common\DefaultController;
use App\DataObject\SalvarEdicaoImagemDTO;
use App\Serializer\MediaItemSerializer;
use App\Service\MediaItem\SalvarEdicaoImagemService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/v1/media-itens/edicoes', name: 'api_media_itens_edicoes_')]
final class EdicaoImagemController extends DefaultController
{
    public function __construct(
        private readonly SalvarEdicaoImagemService $salvarEdicaoImagemService,
        private readonly MediaItemSerializer $mediaItemSerializer,
        private readonly ValidatorInterface $validator,
    ) {}

    #[Route('', name: 'salvar', methods: ['POST'])]
    public function salvar(Request $request): Response
    {
        $dto = SalvarEdicaoImagemDTO::fromRequest($request);
        $violacoes = $this->validator->validate($dto);

        if (count($violacoes) > 0) {
            $detalhes = [];
            foreach ($violacoes as $violacao) {
                $detalhes[$violacao->getPropertyPath()] = (string) $violacao->getMessage();
            }

            return $this->unprocessable('dados_invalidos', $detalhes);
        }

        $mediaItem = $this->salvarEdicaoImagemService->executar($dto);

        return $this->created($this->mediaItemSerializer->normalizar($mediaItem));
    }
}
