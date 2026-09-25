<?php

declare(strict_types=1);

namespace App\Controller;

use App\DataObject\BaixarVideoDTO;
use App\Enum\OrigemMedia;
use App\Service\BaixarVideoService;
use App\Service\ValidadorUrlPlataforma;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

final class DownloadController extends DefaultController
{
    public function __construct(
        private readonly BaixarVideoService $baixarVideoService,
        private readonly ValidadorUrlPlataforma $validadorUrlPlataforma,
    ) {
    }

    #[Route('/api/v1/downloads', name: 'api_downloads_criar', methods: ['POST'])]
    public function criar(#[MapRequestPayload] BaixarVideoDTO $dto): Response
    {
        $mensagem = $this->baixarVideoService->executar($dto, OrigemMedia::MANUAL);
        $plataforma = $this->validadorUrlPlataforma->identificarPlataforma($dto->url());

        return $this->created([
            'url' => $mensagem->url(),
            'origem' => $mensagem->origem()->value,
            'plataforma' => $plataforma->value,
            'plataformaDescricao' => $plataforma->descricao(),
            'status' => 'em_fila',
        ]);
    }
}
