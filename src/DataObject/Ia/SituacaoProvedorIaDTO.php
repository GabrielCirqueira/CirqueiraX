<?php

declare(strict_types=1);

namespace App\DataObject\Ia;

use App\Enum\ProvedorIa;
use DateTimeImmutable;

final readonly class SituacaoProvedorIaDTO
{
    public function __construct(
        public ProvedorIa $provedor,
        public string $modelo,
        public bool $configurado,
        public bool $gratuito,
        public bool $permitido,
        public ?DateTimeImmutable $bloqueadoAte,
        public ?string $motivoBloqueio,
        public int $totalSucessos,
        public int $totalFalhas,
        public ?DateTimeImmutable $ultimoSucessoEm,
    ) {
    }

    public function isBloqueado(DateTimeImmutable $agora): bool
    {
        return null !== $this->bloqueadoAte && $this->bloqueadoAte > $agora;
    }
}
