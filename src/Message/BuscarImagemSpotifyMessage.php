<?php

declare(strict_types=1);

namespace App\Message;

use App\Enum\TipoImagemSpotify;

final readonly class BuscarImagemSpotifyMessage
{
    public function __construct(
        public int $usuarioId,
        public TipoImagemSpotify $tipo,
        public string $nome,
        public ?string $artista = null,
        public ?string $codigoSpotify = null,
        public ?int $duracaoMs = null,
        public int $prioridade = 1,
    ) {
    }
}

