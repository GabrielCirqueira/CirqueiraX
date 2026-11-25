<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

final readonly class PainelPronunciaDTO
{
    public function __construct(
        public int $palavrasDicionario,
        public int $excecoes,
        public int $frases,
        public int $relatosEmAberto,
        public UsoTraducaoDTO $usoTraducao,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'palavrasDicionario' => $this->palavrasDicionario,
            'excecoes' => $this->excecoes,
            'frases' => $this->frases,
            'relatosEmAberto' => $this->relatosEmAberto,
            'usoTraducao' => $this->usoTraducao->paraArray(),
        ];
    }
}
