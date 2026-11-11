<?php

declare(strict_types=1);

namespace App\DataObject\IdentificacaoMusica;

final readonly class EntradaIdentificacaoDTO
{
    public const int TAMANHO_MAXIMO_DESCRICAO = 500;

    public ?string $descricao;

    public function __construct(
        public string $id,
        public string $titulo,
        public string $canal,
        public ?int $duracaoMs,
        public ?string $categoriaId,
        ?string $descricao,
    ) {
        $this->descricao = null === $descricao ? null : mb_substr($descricao, 0, self::TAMANHO_MAXIMO_DESCRICAO);
    }

    /**
     * @return array<string, int|string|null>
     */
    public function paraPedido(): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'canal' => $this->canal,
            'duracaoSegundos' => null === $this->duracaoMs ? null : intdiv($this->duracaoMs, 1000),
            'categoriaId' => $this->categoriaId,
            'descricao' => $this->descricao,
        ];
    }
}
