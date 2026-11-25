<?php

declare(strict_types=1);

namespace App\Feature\Pronuncia\Resolvedor;

use App\DataObject\Pronuncia\ContextoPronunciaDTO;
use App\DataObject\Pronuncia\FonemasResolvidosDTO;
use App\Domain\Pronuncia\ResolvedorHomografos;
use App\Enum\OrigemPronunciaPalavra;
use App\Interface\ResolvedorPronunciaPalavraInterface;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

#[AsTaggedItem(priority: 350)]
final readonly class ResolvedorHomografoPronuncia implements ResolvedorPronunciaPalavraInterface
{
    public function __construct(
        private ResolvedorHomografos $homografos,
    ) {
    }

    public function resolver(string $palavra, ?string $palavraAnterior, ContextoPronunciaDTO $contexto): ?FonemasResolvidosDTO
    {
        $fonemas = $this->homografos->resolver($palavra, $palavraAnterior);

        return null === $fonemas ? null : new FonemasResolvidosDTO(OrigemPronunciaPalavra::Dicionario, $fonemas);
    }
}
