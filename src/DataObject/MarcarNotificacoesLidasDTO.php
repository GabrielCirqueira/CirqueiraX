<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class MarcarNotificacoesLidasDTO
{
    /**
     * @param list<string> $uuids
     */
    public function __construct(
        #[Assert\All([new Assert\Uuid(message: 'Notificação inválida.')])]
        #[Assert\Count(max: 200, maxMessage: 'Marque no máximo {{ limit }} notificações por vez.')]
        public array $uuids = [],
    ) {}
}
