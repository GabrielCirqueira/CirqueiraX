<?php

declare(strict_types=1);

namespace App\Message;

final readonly class ImportarHistoricoYoutubeMessage
{
    public function __construct(
        public string $importacaoUuid,
    ) {
    }
}
