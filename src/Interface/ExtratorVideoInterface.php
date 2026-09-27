<?php

declare(strict_types=1);

namespace App\Interface;

interface ExtratorVideoInterface
{
    /**
     * @return array<string, mixed>
     */
    public function extrairMetadata(string $url): array;

    public function baixarVideo(string $url, string $diretorioDestino): string;
}
