<?php

declare(strict_types=1);

namespace App\DataObject\IdentificacaoMusica;

final readonly class HistoricoMusicalDTO
{
    /**
     * @param array<string, list<array{uuid: string, titulo: string, artistas: list<string>, reproducoes: int}>> $musicasPorPrimeiraPalavra
     */
    public function __construct(
        private array $musicasPorPrimeiraPalavra,
    ) {}

    /**
     * @return list<array{uuid: string, titulo: string, artistas: list<string>, reproducoes: int}>
     */
    public function candidatasComecandoPor(string $palavra): array
    {
        return $this->musicasPorPrimeiraPalavra[$palavra] ?? [];
    }

    public function isVazio(): bool
    {
        return [] === $this->musicasPorPrimeiraPalavra;
    }
}
