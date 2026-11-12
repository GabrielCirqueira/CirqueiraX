<?php

declare(strict_types=1);

namespace App\Service\Notificacao;

use App\DataObject\MarcarNotificacoesLidasDTO;
use App\Entity\Usuario;
use App\Repository\NotificacaoRepository;
use DateTimeImmutable;

final readonly class MarcarNotificacoesLidasService
{
    public function __construct(
        private NotificacaoRepository $notificacaoRepository,
    ) {
    }

    public function executar(Usuario $usuario, MarcarNotificacoesLidasDTO $dto): int
    {
        return $this->notificacaoRepository->marcarComoLidas($usuario, $dto->uuids, new DateTimeImmutable());
    }
}
