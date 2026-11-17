<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Service\Spotify\FilaRecalculoAnaliseService;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\KernelEvents;

#[AsEventListener(event: KernelEvents::TERMINATE)]
final readonly class RecalcularAnaliseAposRespostaListener
{
    public function __construct(
        private FilaRecalculoAnaliseService $fila,
    ) {
    }

    public function __invoke(): void
    {
        $this->fila->executar();
    }
}
