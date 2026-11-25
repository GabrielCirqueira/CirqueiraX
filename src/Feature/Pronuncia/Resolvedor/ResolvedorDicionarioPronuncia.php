<?php

declare(strict_types=1);

namespace App\Feature\Pronuncia\Resolvedor;

use App\DataObject\Pronuncia\ContextoPronunciaDTO;
use App\DataObject\Pronuncia\FonemasResolvidosDTO;
use App\Enum\OrigemPronunciaPalavra;
use App\Interface\ResolvedorPronunciaPalavraInterface;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

#[AsTaggedItem(priority: 300)]
final readonly class ResolvedorDicionarioPronuncia implements ResolvedorPronunciaPalavraInterface
{
    public function resolver(string $palavra, ?string $palavraAnterior, ContextoPronunciaDTO $contexto): ?FonemasResolvidosDTO
    {
        $fonemas = $contexto->fonemasDe($palavra);

        return null === $fonemas ? null : new FonemasResolvidosDTO(OrigemPronunciaPalavra::Dicionario, $fonemas);
    }
}
