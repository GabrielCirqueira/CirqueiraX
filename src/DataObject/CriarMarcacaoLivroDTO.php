<?php

declare(strict_types=1);

namespace App\DataObject;

use App\Enum\TipoMarcacaoLivroAudio;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class CriarMarcacaoLivroDTO
{
    /**
     * @param list<array{pagina: int, esquerda: float, topo: float, largura: float, altura: float}> $retangulos
     */
    public function __construct(
        #[Assert\NotBlank(message: 'O tipo da marcação é obrigatório.')]
        #[Assert\Choice(choices: ['marcador', 'destaque', 'nota'], message: 'Tipo de marcação inválido.')]
        public string $tipo,
        #[Assert\Positive(message: 'A página deve ser maior que zero.')]
        public int $pagina,
        #[Assert\Positive]
        public ?int $numeroBloco = null,
        #[Assert\PositiveOrZero]
        public ?int $indiceTrecho = null,
        #[Assert\PositiveOrZero]
        public ?float $segundos = null,
        #[Assert\Length(max: 5000)]
        public ?string $texto = null,
        #[Assert\Length(max: 10000)]
        public ?string $nota = null,
        #[Assert\Count(max: 200)]
        #[Assert\All([
            new Assert\Collection(
                fields: [
                    'pagina' => [new Assert\Type('integer'), new Assert\Positive()],
                    'esquerda' => [new Assert\Type('numeric')],
                    'topo' => [new Assert\Type('numeric')],
                    'largura' => [new Assert\Type('numeric')],
                    'altura' => [new Assert\Type('numeric')],
                ],
            ),
        ])]
        public array $retangulos = [],
    ) {}

    public function tipo(): TipoMarcacaoLivroAudio
    {
        return TipoMarcacaoLivroAudio::from($this->tipo);
    }

    public function textoLimpo(): ?string
    {
        $texto = null !== $this->texto ? trim($this->texto) : '';

        return '' !== $texto ? $texto : null;
    }

    public function notaLimpa(): ?string
    {
        $nota = null !== $this->nota ? trim($this->nota) : '';

        return '' !== $nota ? $nota : null;
    }

    /**
     * @return list<array{pagina: int, esquerda: float, topo: float, largura: float, altura: float}>
     */
    public function retangulosNormalizados(): array
    {
        return array_map(static fn(array $retangulo): array => [
            'pagina' => (int) $retangulo['pagina'],
            'esquerda' => round((float) $retangulo['esquerda'], 3),
            'topo' => round((float) $retangulo['topo'], 3),
            'largura' => round((float) $retangulo['largura'], 3),
            'altura' => round((float) $retangulo['altura'], 3),
        ], $this->retangulos);
    }
}
