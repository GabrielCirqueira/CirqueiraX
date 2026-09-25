<?php

declare(strict_types=1);

namespace App\Service;

use App\DataObject\BaixarVideoDTO;
use App\Enum\OrigemMedia;
use App\Message\BaixarVideoMessage;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class BaixarVideoService
{
    public function __construct(
        private ValidadorUrlPlataforma $validadorUrlPlataforma,
        private MessageBusInterface $messageBus,
    ) {}

    public function executar(BaixarVideoDTO $dto, OrigemMedia $origem = OrigemMedia::BOT_TELEGRAM): BaixarVideoMessage
    {
        if (!$this->validadorUrlPlataforma->validar($dto->url())) {
            throw new \DomainException('url_invalida', 400);
        }

        $mensagem = new BaixarVideoMessage(
            url: $dto->url(),
            origem: $origem,
        );

        $this->messageBus->dispatch($mensagem);

        return $mensagem;
    }
}
