<?php

declare(strict_types=1);

namespace App\Controller\TransferenciaPlaylist;

use App\Controller\Common\DefaultController;
use App\DataObject\TransferenciaPlaylist\ConfirmarPreviaTransferenciaDTO;
use App\DataObject\TransferenciaPlaylist\IniciarTransferenciaPlaylistDTO;
use App\DataObject\TransferenciaPlaylist\SincronizarVinculoPlaylistDTO;
use App\Entity\Usuario;
use App\Enum\ServicoPlaylist;
use App\Serializer\TransferenciaPlaylistSerializer;
use App\Service\TransferenciaPlaylist\ConfirmarPreviaTransferenciaService;
use App\Service\TransferenciaPlaylist\DetectarParesPlaylistDestinoService;
use App\Service\TransferenciaPlaylist\ExecutarTransferenciaPlaylistService;
use App\Service\TransferenciaPlaylist\IniciarTransferenciaPlaylistService;
use App\Service\TransferenciaPlaylist\ListarPlaylistsServicoService;
use App\Service\TransferenciaPlaylist\ListarTransferenciasPlaylistService;
use App\Service\TransferenciaPlaylist\ListarVinculosPlaylistService;
use App\Service\TransferenciaPlaylist\ObterDetalheTransferenciaPlaylistService;
use App\Service\TransferenciaPlaylist\SincronizarVinculoPlaylistService;
use DomainException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/transferencia-playlists', name: 'api_transferencia_playlists_')]
final class TransferenciaPlaylistController extends DefaultController
{
    public function __construct(
        private readonly ConfirmarPreviaTransferenciaService $confirmarPrevia,
        private readonly DetectarParesPlaylistDestinoService $detectarPares,
        private readonly ExecutarTransferenciaPlaylistService $executarTransferencia,
        private readonly IniciarTransferenciaPlaylistService $iniciarTransferencia,
        private readonly ListarPlaylistsServicoService $listarPlaylists,
        private readonly ListarTransferenciasPlaylistService $listarTransferencias,
        private readonly ListarVinculosPlaylistService $listarVinculos,
        private readonly ObterDetalheTransferenciaPlaylistService $obterDetalhe,
        private readonly SincronizarVinculoPlaylistService $sincronizarVinculo,
        private readonly TransferenciaPlaylistSerializer $serializer,
    ) {
    }

    #[Route('', name: 'listar', methods: ['GET'])]
    public function listar(#[CurrentUser] Usuario $usuario): Response
    {
        $transferencias = $this->listarTransferencias->listarPendentes($usuario);

        return $this->success([
            'itens' => array_map(
                $this->serializer->serializarResumo(...),
                $transferencias,
            ),
        ]);
    }

    #[Route('/servicos/{servico}/playlists', name: 'listar_playlists', methods: ['GET'])]
    public function listarPlaylists(string $servico, #[CurrentUser] Usuario $usuario): Response
    {
        $servicoEnum = ServicoPlaylist::tryFrom($servico);
        if (null === $servicoEnum) {
            return $this->error('Serviço de playlist inválido.');
        }

        try {
            $lista = $this->listarPlaylists->executar($usuario, $servicoEnum);

            return $this->success([
                'itens' => $this->serializer->serializarListaPlaylists($lista->itens),
                'total' => $lista->total,
            ]);
        } catch (DomainException $e) {
            return $this->error($e->getMessage(), $e->getCode() > 0 ? $e->getCode() : Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/pares', name: 'detectar_pares', methods: ['GET'])]
    public function detectarPares(#[CurrentUser] Usuario $usuario): Response
    {
        try {
            $spotify = $this->listarPlaylists->executar($usuario, ServicoPlaylist::Spotify);
            $youtube = $this->listarPlaylists->executar($usuario, ServicoPlaylist::Youtube);
            $pares = $this->detectarPares->executar($spotify, $youtube);

            return $this->success($this->serializer->serializarPares($pares));
        } catch (DomainException $e) {
            return $this->error($e->getMessage(), $e->getCode() > 0 ? $e->getCode() : Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/vinculos', name: 'listar_vinculos', methods: ['GET'])]
    public function listarVinculos(#[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->serializer->serializarVinculos($this->listarVinculos->executar($usuario)));
    }

    #[Route('/vinculos/{uuid}/sincronizar', name: 'sincronizar_vinculo', methods: ['POST'])]
    public function sincronizarVinculo(
        string $uuid,
        #[MapRequestPayload(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] SincronizarVinculoPlaylistDTO $dto,
        #[CurrentUser] Usuario $usuario,
    ): Response {
        try {
            $vinculo = $this->sincronizarVinculo->enfileirar($usuario, $uuid, $dto->force);

            return $this->success($this->serializer->serializarVinculo($vinculo));
        } catch (DomainException $e) {
            return $this->error($e->getMessage(), $e->getCode() > 0 ? $e->getCode() : Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('', name: 'iniciar', methods: ['POST'], priority: -10)]
    public function iniciar(
        #[MapRequestPayload] IniciarTransferenciaPlaylistDTO $dto,
        #[CurrentUser] Usuario $usuario,
    ): Response {
        try {
            $transferencia = $this->iniciarTransferencia->executar($usuario, $dto);

            return $this->created($this->serializer->serializarResumo($transferencia));
        } catch (DomainException $e) {
            return $this->error($e->getMessage(), $e->getCode() > 0 ? $e->getCode() : Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/{uuid}', name: 'detalhe', methods: ['GET'], requirements: ['uuid' => '[0-9a-fA-F-]{36}'])]
    public function detalhe(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        try {
            $transferencia = $this->obterDetalhe->executar($usuario, $uuid);

            return $this->success($this->serializer->serializarDetalhe($transferencia));
        } catch (DomainException $e) {
            return $this->error($e->getMessage(), $e->getCode() > 0 ? $e->getCode() : Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/{uuid}/confirmar-previa', name: 'confirmar_previa', methods: ['POST'], requirements: ['uuid' => '[0-9a-fA-F-]{36}'])]
    public function confirmarPrevia(
        string $uuid,
        #[MapRequestPayload] ConfirmarPreviaTransferenciaDTO $dto,
        #[CurrentUser] Usuario $usuario,
    ): Response {
        try {
            $transferencia = $this->confirmarPrevia->executar($usuario, $uuid, $dto);

            return $this->success($this->serializer->serializarDetalhe($transferencia));
        } catch (DomainException $e) {
            return $this->error($e->getMessage(), $e->getCode() > 0 ? $e->getCode() : Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/{uuid}/executar', name: 'executar', methods: ['POST'], requirements: ['uuid' => '[0-9a-fA-F-]{36}'])]
    public function executar(string $uuid, #[CurrentUser] Usuario $usuario): Response
    {
        try {
            $transferencia = $this->executarTransferencia->enfileirar($usuario, $uuid);

            return $this->success($this->serializer->serializarResumo($transferencia));
        } catch (DomainException $e) {
            return $this->error($e->getMessage(), $e->getCode() > 0 ? $e->getCode() : Response::HTTP_BAD_REQUEST);
        }
    }
}
