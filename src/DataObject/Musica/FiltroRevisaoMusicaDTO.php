<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use App\Enum\TipoRevisaoMusica;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class FiltroRevisaoMusicaDTO
{
    public const int TAMANHO_PAGINA_PADRAO = 20;
    public const int TAMANHO_PAGINA_MAXIMO = 100;
    public const int TAMANHO_MAXIMO_BUSCA = 100;
    public const string SUGESTAO_MUSICA = 'musica';
    public const string SUGESTAO_NAO_MUSICA = 'nao_musica';
    public const string SUGESTAO_MASHUP = 'mashup';
    public const string SUGESTAO_SEM = 'sem';
    public const array SUGESTOES = [self::SUGESTAO_MUSICA, self::SUGESTAO_NAO_MUSICA, self::SUGESTAO_MASHUP, self::SUGESTAO_SEM];
    public const string ORDEM_RECENTES = 'recentes';
    public const string ORDEM_MAIS_OUVIDOS = 'mais_ouvidos';
    public const string ORDEM_CONFIANCA = 'confianca';
    public const string ORDEM_CANAL = 'canal';
    public const array ORDENS = [self::ORDEM_RECENTES, self::ORDEM_MAIS_OUVIDOS, self::ORDEM_CONFIANCA, self::ORDEM_CANAL];

    public function __construct(
        public TipoRevisaoMusica $tipo = TipoRevisaoMusica::SemVinculo,
        #[Assert\Positive]
        public int $pagina = 1,
        #[Assert\Range(min: 1, max: self::TAMANHO_PAGINA_MAXIMO)]
        public int $porPagina = self::TAMANHO_PAGINA_PADRAO,
        #[Assert\Length(max: self::TAMANHO_MAXIMO_BUSCA)]
        public ?string $busca = null,
        #[Assert\Choice(choices: self::SUGESTOES)]
        public ?string $sugestao = null,
        #[Assert\Range(min: 0, max: 100)]
        public ?int $confiancaMinima = null,
        #[Assert\Choice(choices: self::ORDENS)]
        public string $ordem = self::ORDEM_RECENTES,
        public bool $semTitulo = false,
        public bool $incluirCanaisUnicos = false,
    ) {
    }

    public function deslocamento(): int
    {
        return ($this->pagina - 1) * $this->porPagina;
    }

    public function buscaNormalizada(): ?string
    {
        $busca = trim((string) $this->busca);

        return '' === $busca ? null : $busca;
    }
}
