<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\Service\ResetInterface;
use Throwable;

final class FilaRecalculoAnaliseService implements ResetInterface
{
    private const int LIMITE_POR_REQUISICAO = 12;

    /** @var array<string, callable(): void> */
    private array $pendentes = [];

    public function __construct(
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @param callable(): void $recalcular
     */
    public function agendar(string $chave, callable $recalcular): void
    {
        if (count($this->pendentes) >= self::LIMITE_POR_REQUISICAO) {
            return;
        }

        $this->pendentes[$chave] = $recalcular;
    }

    public function executar(): void
    {
        $pendentes = $this->pendentes;
        $this->pendentes = [];

        foreach ($pendentes as $chave => $recalcular) {
            try {
                $recalcular();
            } catch (Throwable $erro) {
                $this->logger->warning('Falha ao recalcular análise de música em segundo plano.', [
                    'chave' => $chave,
                    'erro' => $erro->getMessage(),
                ]);
            }
        }
    }

    public function reset(): void
    {
        $this->pendentes = [];
    }
}
