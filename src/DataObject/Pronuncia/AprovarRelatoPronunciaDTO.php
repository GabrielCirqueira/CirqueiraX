<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class AprovarRelatoPronunciaDTO
{
    private const string CAMPO_PALAVRA = 'palavra';
    private const string CAMPO_PRONUNCIA = 'pronuncia';

    /**
     * @param list<array{palavra?: mixed, pronuncia?: mixed}> $palavras
     */
    public function __construct(
        #[Assert\Length(max: TraduzirTextoDTO::TAMANHO_MAXIMO, maxMessage: 'A tradução pode ter no máximo {{ limit }} caracteres.')]
        public ?string $traducao = null,
        #[Assert\Count(max: 30, maxMessage: 'Corrija no máximo {{ limit }} palavras por vez.')]
        public array $palavras = [],
    ) {
    }

    public function traducao(): ?string
    {
        $traducao = trim((string) $this->traducao);

        return '' === $traducao ? null : $traducao;
    }

    /**
     * @return list<CorrecaoPalavraPronunciaDTO>
     */
    public function palavras(): array
    {
        $correcoes = [];
        foreach ($this->palavras as $item) {
            $palavra = is_array($item) && is_string($item[self::CAMPO_PALAVRA] ?? null) ? $item[self::CAMPO_PALAVRA] : '';
            $pronuncia = is_array($item) && is_string($item[self::CAMPO_PRONUNCIA] ?? null) ? $item[self::CAMPO_PRONUNCIA] : '';
            $correcoes[] = new CorrecaoPalavraPronunciaDTO($palavra, $pronuncia);
        }

        return $correcoes;
    }
}
