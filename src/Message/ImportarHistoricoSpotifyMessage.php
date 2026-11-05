<?php

declare(strict_types=1);

namespace App\Message;

final readonly class ImportarHistoricoSpotifyMessage
{
    public function __construct(
        public string $importacaoUuid,
    ) {}

    public function importacaoUuid(): string
    {
        return $this->importacaoUuid;
    }
}
