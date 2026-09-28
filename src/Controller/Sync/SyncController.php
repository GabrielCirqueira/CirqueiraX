<?php

declare(strict_types=1);

namespace App\Controller\Sync;

use App\Controller\Common\DefaultController;
use App\Exception\Syncthing\SyncthingException;
use App\Interface\SyncthingClientInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/sync', name: 'api_sync_')]
final class SyncController extends DefaultController
{
    public function __construct(
        private readonly SyncthingClientInterface $syncthingClient,
    ) {}

    #[Route('/pastas', name: 'pastas', methods: ['GET'])]
    public function pastas(): Response
    {
        return $this->success($this->syncthingClient->obterStatusPastas());
    }

    #[Route('/pastas/{id}/sincronizar', name: 'sincronizar_pasta', methods: ['POST'])]
    public function sincronizar(string $id): Response
    {
        try {
            $resultado = $this->syncthingClient->sincronizarPasta($id);

            return $this->success([
                'sucesso' => $resultado,
                'pastaId' => $id,
                'mensagem' => 'Sincronização iniciada com sucesso.',
            ]);
        } catch (SyncthingException $e) {
            return $this->error($e->getMessage(), Response::HTTP_BAD_GATEWAY);
        }
    }
}
