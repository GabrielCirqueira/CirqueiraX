<?php

declare(strict_types=1);

namespace App\DataObject\IdentificacaoMusica;

use App\Enum\TipoIdentificacaoMusica;
use App\Enum\TipoVersaoMusica;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class ResultadoIdentificacaoDTO
{
    public const int CONFIANCA_MINIMA = 0;
    public const int CONFIANCA_MAXIMA = 100;
    public const int LIMITE_ALTERNATIVAS = 2;

    /**
     * @param list<ComponenteIdentificadoDTO> $componentes
     * @param list<ComponenteIdentificadoDTO> $alternativas
     */
    public function __construct(
        #[Assert\NotBlank]
        public string $id,
        public TipoIdentificacaoMusica $tipo,
        #[Assert\Range(min: self::CONFIANCA_MINIMA, max: self::CONFIANCA_MAXIMA)]
        public int $confianca,
        public TipoVersaoMusica $versao,
        #[Assert\Valid]
        public array $componentes,
        public bool $ambiguo,
        #[Assert\Valid]
        #[Assert\Count(max: self::LIMITE_ALTERNATIVAS)]
        public array $alternativas,
    ) {
    }
}
