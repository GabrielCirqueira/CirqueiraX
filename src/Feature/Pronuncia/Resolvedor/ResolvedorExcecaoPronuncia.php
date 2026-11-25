<?php

declare(strict_types=1);

namespace App\Feature\Pronuncia\Resolvedor;

use App\DataObject\Pronuncia\ContextoPronunciaDTO;
use App\DataObject\Pronuncia\FonemasResolvidosDTO;
use App\Enum\OrigemPronunciaPalavra;
use App\Interface\ResolvedorPronunciaPalavraInterface;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

#[AsTaggedItem(priority: 400)]
final readonly class ResolvedorExcecaoPronuncia implements ResolvedorPronunciaPalavraInterface
{
    public function resolver(string $palavra, ?string $palavraAnterior, ContextoPronunciaDTO $contexto): ?FonemasResolvidosDTO
    {
        $excecao = $contexto->excecaoDe($palavra);
        if (null === $excecao) {
            return null;
        }

        return new FonemasResolvidosDTO(
            OrigemPronunciaPalavra::Excecao,
            $contexto->fonemasDe($palavra) ?? [],
            $excecao,
        );
    }
}
