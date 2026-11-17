<?php

declare(strict_types=1);

namespace App\Security\Attribute;

use App\Enum\FuncionalidadeSistema;
use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
final readonly class RequerPermissao
{
    public function __construct(
        public FuncionalidadeSistema $funcionalidade,
    ) {}
}
