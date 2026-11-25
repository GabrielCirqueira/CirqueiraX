<?php

declare(strict_types=1);

namespace App\Interface;

interface LeitorDicionarioPronunciaInterface
{
    /**
     * @return iterable<array{palavra: string, variante: int, fonemas: string}>
     */
    public function ler(): iterable;
}
