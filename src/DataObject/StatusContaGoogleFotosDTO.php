<?php

declare(strict_types=1);

namespace App\DataObject;

final readonly class StatusContaGoogleFotosDTO
{
    public function __construct(
        public bool $conectado,
        public ?string $email = null,
        public ?string $conectadoEm = null,
        public bool $tokenExpirado = false,
        public ?string $expiraEm = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'conectado' => $this->conectado,
            'email' => $this->email,
            'conectadoEm' => $this->conectadoEm,
            'tokenExpirado' => $this->tokenExpirado,
            'expiraEm' => $this->expiraEm,
        ];
    }
}
