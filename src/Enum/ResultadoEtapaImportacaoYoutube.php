<?php

declare(strict_types=1);

namespace App\Enum;

enum ResultadoEtapaImportacaoYoutube: string
{
    case Continuar = 'continuar';
    case Aguardar = 'aguardar';
    case AguardarVez = 'aguardar_vez';
    case Parar = 'parar';
}
