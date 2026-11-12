<?php

declare(strict_types=1);

namespace App\Service\Notificacao;

use App\Entity\Notificacao;
use App\Entity\Usuario;
use App\Repository\NotificacaoRepository;

final readonly class ListarNotificacoesService
{
    public const int LIMITE_PADRAO = 50;
    private const int LIMITE_MAXIMO = 200;

    public function __construct(
        private NotificacaoRepository $notificacaoRepository,
    ) {
    }

    /**
     * @return array{itens: list<Notificacao>, naoLidas: int}
     */
    public function executar(Usuario $usuario, int $limite, bool $somenteNaoLidas): array
    {
        $limiteAplicado = max(1, min($limite, self::LIMITE_MAXIMO));

        return [
            'itens' => $this->notificacaoRepository->listarDoUsuario($usuario, $limiteAplicado, $somenteNaoLidas),
            'naoLidas' => $this->notificacaoRepository->contarNaoLidas($usuario),
        ];
    }
}
