<?php

declare(strict_types=1);

namespace App\Feature\Pronuncia\Resolvedor;

use App\DataObject\Pronuncia\ContextoPronunciaDTO;
use App\DataObject\Pronuncia\FonemasResolvidosDTO;
use App\Domain\Pronuncia\DerivadorPalavrasIngles;
use App\Enum\OrigemPronunciaPalavra;
use App\Interface\ResolvedorPronunciaPalavraInterface;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

#[AsTaggedItem(priority: 200)]
final readonly class ResolvedorDerivacaoPronuncia implements ResolvedorPronunciaPalavraInterface
{
    public function __construct(
        private DerivadorPalavrasIngles $derivador,
    ) {
    }

    public function resolver(string $palavra, ?string $palavraAnterior, ContextoPronunciaDTO $contexto): ?FonemasResolvidosDTO
    {
        $fonemas = $this->derivador->derivar($palavra, $contexto->fonemasDe(...));

        return null === $fonemas ? null : new FonemasResolvidosDTO(OrigemPronunciaPalavra::Derivada, $fonemas);
    }
}
