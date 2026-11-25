<?php

declare(strict_types=1);

namespace App\Feature\Pronuncia\Resolvedor;

use App\DataObject\Pronuncia\ContextoPronunciaDTO;
use App\DataObject\Pronuncia\FonemasResolvidosDTO;
use App\Domain\Pronuncia\RegrasLetraSomIngles;
use App\Enum\OrigemPronunciaPalavra;
use App\Interface\ResolvedorPronunciaPalavraInterface;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

#[AsTaggedItem(priority: 100)]
final readonly class ResolvedorLetraSomPronuncia implements ResolvedorPronunciaPalavraInterface
{
    public function __construct(
        private RegrasLetraSomIngles $regras,
    ) {
    }

    public function resolver(string $palavra, ?string $palavraAnterior, ContextoPronunciaDTO $contexto): ?FonemasResolvidosDTO
    {
        return new FonemasResolvidosDTO(OrigemPronunciaPalavra::Aproximada, $this->regras->aproximar($palavra));
    }
}
