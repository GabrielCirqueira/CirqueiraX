<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\Pronuncia\ContextoPronunciaDTO;
use App\DataObject\Pronuncia\FonemasResolvidosDTO;
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

#[AutoconfigureTag(self::TAG)]
interface ResolvedorPronunciaPalavraInterface
{
    public const string TAG = 'app.resolvedor_pronuncia_palavra';

    public function resolver(string $palavra, ?string $palavraAnterior, ContextoPronunciaDTO $contexto): ?FonemasResolvidosDTO;
}
