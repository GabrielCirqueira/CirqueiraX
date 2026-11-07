<?php

declare(strict_types=1);

namespace App\DataObject\Transcricao;

use App\Enum\FiltroListagemTranscricao;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class FiltroTranscricoesDTO
{
    public function __construct(
        #[Assert\Length(max: 120, maxMessage: 'A busca deve ter no máximo 120 caracteres.')]
        public ?string $busca = null,
        public FiltroListagemTranscricao $filtro = FiltroListagemTranscricao::TODAS,
        #[Assert\Positive(message: 'A página deve ser maior ou igual a 1.')]
        public int $pagina = 1,
        #[Assert\Range(min: 1, max: 100, notInRangeMessage: 'O limite por página deve estar entre 1 e 100.')]
        public int $limite = 30,
    ) {}

    public function busca(): ?string
    {
        $busca = trim((string) $this->busca);

        return '' === $busca ? null : $busca;
    }

    public function filtro(): FiltroListagemTranscricao
    {
        return $this->filtro;
    }

    public function pagina(): int
    {
        return max(1, $this->pagina);
    }

    public function limite(): int
    {
        return max(1, min(100, $this->limite));
    }
}
