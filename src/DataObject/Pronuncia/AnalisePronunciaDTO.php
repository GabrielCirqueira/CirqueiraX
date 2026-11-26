<?php

declare(strict_types=1);

namespace App\DataObject\Pronuncia;

final readonly class AnalisePronunciaDTO
{
    public const int VERSAO_MOTOR = 2;
    private const string SEPARADOR_SENTENCAS = ' ';

    /**
     * @param list<SentencaPronunciadaDTO> $sentencas
     */
    public function __construct(
        public array $sentencas,
    ) {
    }

    public function pronuncia(): string
    {
        return implode(self::SEPARADOR_SENTENCAS, array_map(static fn (SentencaPronunciadaDTO $sentenca): string => $sentenca->pronuncia, $this->sentencas));
    }

    public function falaNatural(): string
    {
        return implode(self::SEPARADOR_SENTENCAS, array_map(static fn (SentencaPronunciadaDTO $sentenca): string => $sentenca->falaNatural, $this->sentencas));
    }

    public function simples(): string
    {
        return implode(self::SEPARADOR_SENTENCAS, array_map(static fn (SentencaPronunciadaDTO $sentenca): string => $sentenca->simples, $this->sentencas));
    }

    /**
     * @return list<PalavraPronunciadaDTO>
     */
    public function palavras(): array
    {
        return array_merge(...array_map(static fn (SentencaPronunciadaDTO $sentenca): array => $sentenca->palavras(), $this->sentencas));
    }

    /**
     * @return list<string>
     */
    public function chavesUnicas(): array
    {
        return array_values(array_unique(array_map(static fn (PalavraPronunciadaDTO $palavra): string => $palavra->chave, $this->palavras())));
    }

    /**
     * @return list<string>
     */
    public function palavrasAproximadas(): array
    {
        $aproximadas = array_filter($this->palavras(), static fn (PalavraPronunciadaDTO $palavra): bool => $palavra->isAproximada());

        return array_values(array_unique(array_map(static fn (PalavraPronunciadaDTO $palavra): string => $palavra->chave, $aproximadas)));
    }

    public function palavrasIndexadas(): string
    {
        return ' '.implode(' ', $this->chavesUnicas()).' ';
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'versaoMotor' => self::VERSAO_MOTOR,
            'pronuncia' => $this->pronuncia(),
            'falaNatural' => $this->falaNatural(),
            'simples' => $this->simples(),
            'palavrasAproximadas' => $this->palavrasAproximadas(),
            'sentencas' => array_map(static fn (SentencaPronunciadaDTO $sentenca): array => $sentenca->paraArray(), $this->sentencas),
        ];
    }
}
