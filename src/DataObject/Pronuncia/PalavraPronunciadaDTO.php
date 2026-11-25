<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

use App\Enum\OrigemPronunciaPalavra;

final readonly class PalavraPronunciadaDTO
{
    public const string SEPARADOR_SILABAS = '-';

    /**
     * @param list<string> $silabas
     * @param list<string> $fonemas
     * @param list<string> $dicas
     */
    public function __construct(
        public string $texto,
        public string $chave,
        public array $silabas,
        public ?int $tonica,
        public array $fonemas,
        public OrigemPronunciaPalavra $origem,
        public array $dicas,
        public bool $funcional,
    ) {
    }

    public function figurada(): string
    {
        return implode(self::SEPARADOR_SILABAS, $this->silabas);
    }

    public function isAproximada(): bool
    {
        return $this->origem->isAproximada();
    }

    /**
     * @param list<string> $silabas
     */
    public function comSilabas(array $silabas): self
    {
        return new self($this->texto, $this->chave, $silabas, $this->tonica, $this->fonemas, $this->origem, $this->dicas, $this->funcional);
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'texto' => $this->texto,
            'chave' => $this->chave,
            'silabas' => $this->silabas,
            'tonica' => $this->tonica,
            'figurada' => $this->figurada(),
            'fonemas' => $this->fonemas,
            'origem' => $this->origem->value,
            'origemDescricao' => $this->origem->descricao(),
            'aproximada' => $this->isAproximada(),
            'dicas' => $this->dicas,
            'funcional' => $this->funcional,
        ];
    }
}
