<?php

declare(strict_types=1);

namespace App\DataObject\Ia;

final readonly class EsquemaRespostaIaDTO
{
    private const string CHAVE_OBRIGATORIOS = 'required';

    /**
     * @param array<string, mixed> $esquema
     */
    public function __construct(
        public string $nome,
        public array $esquema,
    ) {
    }

    /**
     * @return list<string>
     */
    public function camposObrigatorios(): array
    {
        $obrigatorios = $this->esquema[self::CHAVE_OBRIGATORIOS] ?? [];

        return is_array($obrigatorios) ? array_values(array_filter($obrigatorios, is_string(...))) : [];
    }
}
