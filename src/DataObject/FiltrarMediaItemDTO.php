<?php

declare(strict_types=1);

namespace App\DataObject;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class FiltrarMediaItemDTO
{
    public function __construct(
        public ?string $status = null,
        public ?string $origem = null,
        public ?string $categoriaId = null,
        public ?string $busca = null,
        public string $ordenacao = 'criadoEm',
        public string $direcao = 'DESC',
        #[Assert\Positive(message: 'A página deve ser maior ou igual a 1.')]
        public int $pagina = 1,
        #[Assert\Range(min: 1, max: 100, notInRangeMessage: 'O limite por página deve estar entre 1 e 100.')]
        public int $porPagina = 20,
    ) {
    }

    public function status(): ?string
    {
        return $this->status;
    }

    public function origem(): ?string
    {
        return $this->origem;
    }

    public function categoriaId(): ?string
    {
        return $this->categoriaId;
    }

    public function busca(): ?string
    {
        return $this->busca;
    }

    public function ordenacao(): string
    {
        return $this->ordenacao;
    }

    public function direcao(): string
    {
        return 'ASC' === strtoupper($this->direcao) ? 'ASC' : 'DESC';
    }

    public function pagina(): int
    {
        return max(1, $this->pagina);
    }

    public function porPagina(): int
    {
        return max(1, min(100, $this->porPagina));
    }

    /**
     * @return array{
     *     status?: string|null,
     *     origem?: string|null,
     *     categoriaId?: string|null,
     *     busca?: string|null,
     *     ordenacao?: string,
     *     direcao?: string
     * }
     */
    public function paraFiltros(): array
    {
        return array_filter([
            'status' => $this->status,
            'origem' => $this->origem,
            'categoriaId' => $this->categoriaId,
            'busca' => $this->busca,
            'ordenacao' => $this->ordenacao,
            'direcao' => $this->direcao(),
        ], static fn ($v) => null !== $v);
    }
}
