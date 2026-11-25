<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\DataObject\Pronuncia\CorrecaoPalavraPronunciaDTO;
use App\Domain\Pronuncia\ValidadorCorrecaoPronuncia;
use App\Entity\ExcecaoPronuncia;
use App\Enum\OrigemExcecaoPronuncia;
use App\Exception\Pronuncia\PronunciaException;
use App\Repository\ExcecaoPronunciaRepository;

final readonly class GerenciarExcecoesPronunciaService
{
    private const int LIMITE_LISTAGEM = 300;

    public function __construct(
        private ExcecaoPronunciaRepository $excecaoRepository,
        private ValidadorCorrecaoPronuncia $validador,
        private RecalcularFrasesPronunciaService $recalcularFrases,
    ) {
    }

    /**
     * @return list<ExcecaoPronuncia>
     */
    public function listar(?string $busca): array
    {
        return $this->excecaoRepository->listar($busca, self::LIMITE_LISTAGEM);
    }

    /**
     * Cria ou atualiza a pronúncia revisada de uma palavra e refaz as frases salvas que a usam.
     *
     * @throws PronunciaException
     */
    public function salvar(CorrecaoPalavraPronunciaDTO $correcao, ?string $observacao, OrigemExcecaoPronuncia $origem): ExcecaoPronuncia
    {
        $excecao = $this->registrar($correcao, $observacao, $origem);
        $this->recalcularFrases->porPalavras([$excecao->palavra()]);

        return $excecao;
    }

    /**
     * Grava várias correções e refaz as frases afetadas uma única vez no final.
     *
     * @param list<CorrecaoPalavraPronunciaDTO> $correcoes
     *
     * @return list<string>
     *
     * @throws PronunciaException
     */
    public function salvarLote(array $correcoes, OrigemExcecaoPronuncia $origem): array
    {
        $palavras = [];
        foreach ($correcoes as $correcao) {
            $palavras[] = $this->registrar($correcao, null, $origem)->palavra();
        }

        if ([] !== $palavras) {
            $this->recalcularFrases->porPalavras($palavras);
        }

        return $palavras;
    }

    /**
     * @throws PronunciaException
     */
    public function apagar(string $uuid): void
    {
        $excecao = $this->excecaoRepository->buscarPorUuid($uuid) ?? throw PronunciaException::excecaoNaoEncontrada();
        $palavra = $excecao->palavra();
        $this->excecaoRepository->remover($excecao);
        $this->recalcularFrases->porPalavras([$palavra]);
    }

    private function registrar(CorrecaoPalavraPronunciaDTO $correcao, ?string $observacao, OrigemExcecaoPronuncia $origem): ExcecaoPronuncia
    {
        $normalizada = $this->validador->normalizar($correcao);
        $excecao = $this->excecaoRepository->buscarPorPalavra($normalizada->palavra);
        $excecao?->corrigirPara($normalizada->pronuncia, $observacao, $origem);
        $excecao ??= new ExcecaoPronuncia($normalizada->palavra, $normalizada->pronuncia, $observacao, $origem);
        $this->excecaoRepository->salvar($excecao);

        return $excecao;
    }
}
