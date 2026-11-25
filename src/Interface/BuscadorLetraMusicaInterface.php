<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\Pronuncia\LetraEncontradaDTO;
use App\Exception\Pronuncia\LetraMusicaException;

interface BuscadorLetraMusicaInterface
{
    /**
     * @throws LetraMusicaException quando o serviço de letras não responde
     */
    public function buscar(string $titulo, string $artista, ?string $album, int $duracaoMs): LetraEncontradaDTO;
}
