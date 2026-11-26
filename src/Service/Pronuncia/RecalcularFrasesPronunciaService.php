<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\DataObject\Pronuncia\AnalisePronunciaDTO;
use App\Entity\FrasePronuncia;
use App\Repository\FrasePronunciaRepository;

final readonly class RecalcularFrasesPronunciaService
{
    private const int LIMITE_FRASES_POR_CORRECAO = 1000;
    private const string CHAVE_VERSAO_MOTOR = 'versaoMotor';

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

    /**
     * Refaz a análise salva quando ela foi gerada por uma versão anterior do motor. Não grava: quem chama decide quando dar flush.
     */
    public function atualizarSeDesatualizada(FrasePronuncia $frase): bool
    {
        if (AnalisePronunciaDTO::VERSAO_MOTOR === ($frase->analise()[self::CHAVE_VERSAO_MOTOR] ?? null)) {
            return false;
        }

        $this->recalcular($frase);

        return true;
    }

    private function recalcular(FrasePronuncia $frase): void
    {
        $analise = $this->gerarAnalise->executar($frase->textoIngles());
        $frase->atualizarAnalise($analise->paraArray(), $analise->palavrasIndexadas());
    }
}
