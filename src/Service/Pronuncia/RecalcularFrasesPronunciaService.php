<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\Entity\FrasePronuncia;
use App\Repository\FrasePronunciaRepository;

final readonly class RecalcularFrasesPronunciaService
{
    private const int LIMITE_FRASES_POR_CORRECAO = 1000;

    public function __construct(
        private FrasePronunciaRepository $fraseRepository,
        private GerarAnalisePronunciaService $gerarAnalise,
    ) {
    }

    /**
     * Refaz a pronúncia de todas as frases salvas que usam as palavras corrigidas, para a correção valer no histórico também.
     *
     * @param list<string> $palavras
     */
    public function porPalavras(array $palavras): int
    {
        $frases = $this->fraseRepository->listarContendoPalavras($palavras, self::LIMITE_FRASES_POR_CORRECAO);
        foreach ($frases as $frase) {
            $this->recalcular($frase);
        }
        $this->fraseRepository->flush();

        return count($frases);
    }

    public function frase(FrasePronuncia $frase): void
    {
        $this->recalcular($frase);
        $this->fraseRepository->flush();
    }

    private function recalcular(FrasePronuncia $frase): void
    {
        $analise = $this->gerarAnalise->executar($frase->textoIngles());
        $frase->atualizarAnalise($analise->paraArray(), $analise->palavrasIndexadas());
    }
}
