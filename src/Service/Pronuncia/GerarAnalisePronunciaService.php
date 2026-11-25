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

        $candidatos = $palavras;
        foreach ($palavras as $palavra) {
            array_push($candidatos, ...$this->derivador->candidatos($palavra));
        }

        $contexto = new ContextoPronunciaDTO(
            $this->dicionarioRepository->buscarVariantesPorPalavras($candidatos),
            $this->excecaoRepository->mapaPorPalavras($palavras),
        );

        return $this->pronunciarTexto->executar($sentencas, $contexto);
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
