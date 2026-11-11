<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use App\Enum\TipoRevisaoMusica;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class FiltroRevisaoMusicaDTO
{
    public const int TAMANHO_PAGINA_PADRAO = 20;
    public const int TAMANHO_PAGINA_MAXIMO = 100;

    public function __construct(
        public TipoRevisaoMusica $tipo = TipoRevisaoMusica::SemVinculo,
        #[Assert\Positive]
        public int $pagina = 1,
        #[Assert\Range(min: 1, max: self::TAMANHO_PAGINA_MAXIMO)]
        public int $porPagina = self::TAMANHO_PAGINA_PADRAO,
    ) {
    }

    public function deslocamento(): int
    {
        return ($this->pagina - 1) * $this->porPagina;
    }
}
