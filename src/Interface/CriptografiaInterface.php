<?php

declare(strict_types=1);

namespace App\Interface;

interface CriptografiaInterface
{
    public function criptografar(string $textoPlano): string;

    public function descriptografar(string $textoCriptografado): string;
}
