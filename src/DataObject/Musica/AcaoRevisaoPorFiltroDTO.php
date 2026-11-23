<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use App\Enum\AcaoRevisaoVideo;
use App\Enum\TipoRevisaoMusica;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class AcaoRevisaoPorFiltroDTO
{
    public function __construct(
        #[Assert\Choice(choices: AcaoRevisaoEmLoteDTO::ACOES_PERMITIDAS)]
        public AcaoRevisaoVideo $acao,
        public TipoRevisaoMusica $tipo,
        #[Assert\Length(max: FiltroRevisaoMusicaDTO::TAMANHO_MAXIMO_BUSCA)]
        public ?string $busca = null,
        #[Assert\Choice(choices: FiltroRevisaoMusicaDTO::SUGESTOES)]
        public ?string $sugestao = null,
        #[Assert\Range(min: 0, max: 100)]
        public ?int $confiancaMinima = null,
        public bool $semTitulo = false,
    ) {
    }

    public function filtro(): FiltroRevisaoMusicaDTO
    {
        return new FiltroRevisaoMusicaDTO(
            tipo: $this->tipo,
            busca: $this->busca,
            sugestao: $this->sugestao,
            confiancaMinima: $this->confiancaMinima,
            semTitulo: $this->semTitulo,
        );
    }
}
