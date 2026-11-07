<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

final readonly class ComportamentoReproducaoSpotifyDTO
{
    public function __construct(
        public int $comDadoPulo,
        public int $puladas,
        public int $comDadoAleatorio,
        public int $aleatorias,
    ) {}

    /**
     * @param array{comDadoPulo: int, puladas: int, comDadoAleatorio: int, aleatorias: int} $dados
     */
    public static function deArray(array $dados): self
    {
        return new self($dados['comDadoPulo'], $dados['puladas'], $dados['comDadoAleatorio'], $dados['aleatorias']);
    }

    public function taxaPulos(): ?float
    {
        return $this->comDadoPulo > 0 ? round(($this->puladas / $this->comDadoPulo) * 100, 1) : null;
    }

    public function taxaAleatorio(): ?float
    {
        return $this->comDadoAleatorio > 0 ? round(($this->aleatorias / $this->comDadoAleatorio) * 100, 1) : null;
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'comDadoPulo' => $this->comDadoPulo,
            'puladas' => $this->puladas,
            'taxaPulos' => $this->taxaPulos(),
            'comDadoAleatorio' => $this->comDadoAleatorio,
            'aleatorias' => $this->aleatorias,
            'taxaAleatorio' => $this->taxaAleatorio(),
        ];
    }
}
