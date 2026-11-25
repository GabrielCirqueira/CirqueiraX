<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\DataObject\Pronuncia\AnalisePronunciaDTO;
use App\DataObject\Pronuncia\ContextoPronunciaDTO;
use App\DataObject\Pronuncia\TokenTextoDTO;
use App\Domain\Pronuncia\DerivadorPalavrasIngles;
use App\Domain\Pronuncia\TokenizadorTextoIngles;
use App\Exception\Pronuncia\PronunciaException;
use App\Feature\Pronuncia\PronunciarTextoFeature;
use App\Repository\ExcecaoPronunciaRepository;
use App\Repository\PalavraDicionarioPronunciaRepository;

final readonly class GerarAnalisePronunciaService
{
    public function __construct(
        private TokenizadorTextoIngles $tokenizador,
        private DerivadorPalavrasIngles $derivador,
        private PalavraDicionarioPronunciaRepository $dicionarioRepository,
        private ExcecaoPronunciaRepository $excecaoRepository,
        private PronunciarTextoFeature $pronunciarTexto,
    ) {
    }

    /**
     * Gera a pronúncia figurada de um texto em inglês com uma consulta ao dicionário e outra às exceções, não importa o tamanho do texto.
     *
     * @throws PronunciaException
     */
    public function executar(string $textoIngles): AnalisePronunciaDTO
    {
        $sentencas = $this->tokenizador->tokenizar($textoIngles);
        $palavras = $this->chavesDasPalavras($sentencas);
        if ([] === $palavras) {
            throw PronunciaException::semPalavrasEmIngles();
        }

        return $this->pronunciarTexto->executar($sentencas, $this->montarContexto($palavras));
    }

    /**
     * Pronuncia cada linha separadamente (letra de música), consultando o dicionário uma vez só para todas. Linha sem palavra fica null.
     *
     * @param list<string> $linhas
     *
     * @return list<AnalisePronunciaDTO|null>
     */
    public function executarLinhas(array $linhas): array
    {
        $sentencasPorLinha = array_map(fn (string $linha): array => $this->tokenizador->tokenizar($linha), $linhas);
        $palavras = $this->chavesDasPalavras(array_merge(...$sentencasPorLinha));
        if ([] === $palavras) {
            return array_map(static fn (): null => null, $linhas);
        }

        $contexto = $this->montarContexto($palavras);

        return array_map(
            fn (array $sentencas): ?AnalisePronunciaDTO => [] === $this->chavesDasPalavras($sentencas) ? null : $this->pronunciarTexto->executar($sentencas, $contexto),
            $sentencasPorLinha,
        );
    }

    /**
     * @param list<string> $palavras
     */
    private function montarContexto(array $palavras): ContextoPronunciaDTO
    {
        $candidatos = $palavras;
        foreach ($palavras as $palavra) {
            array_push($candidatos, ...$this->derivador->candidatos($palavra));
        }

        return new ContextoPronunciaDTO(
            $this->dicionarioRepository->buscarVariantesPorPalavras($candidatos),
            $this->excecaoRepository->mapaPorPalavras($palavras),
        );
    }

    /**
     * @param list<array{texto: string, tokens: list<TokenTextoDTO>}> $sentencas
     *
     * @return list<string>
     */
    private function chavesDasPalavras(array $sentencas): array
    {
        $chaves = [];
        foreach ($sentencas as $sentenca) {
            foreach ($sentenca['tokens'] as $token) {
                if ($token->isPalavra()) {
                    $chaves[$token->chave()] = true;
                }
            }
        }

        return array_keys($chaves);
    }
}
