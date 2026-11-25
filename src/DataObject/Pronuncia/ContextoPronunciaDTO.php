<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

final readonly class ContextoPronunciaDTO
{
    /**
     * @param array<string, list<list<string>>> $dicionario chave = palavra; valor = variantes de fonemas ARPAbet
     * @param array<string, string>             $excecoes   chave = palavra; valor = pronúncia figurada revisada
     */
    public function __construct(
        public array $dicionario,
        public array $excecoes,
    ) {
    }

    /**
     * @return list<string>|null
     */
    public function fonemasDe(string $palavra): ?array
    {
        return $this->dicionario[$palavra][0] ?? null;
    }

    /**
     * @return list<list<string>>
     */
    public function variantesDe(string $palavra): array
    {
        return $this->dicionario[$palavra] ?? [];
    }

    public function excecaoDe(string $palavra): ?string
    {
        return $this->excecoes[$palavra] ?? null;
    }
}
