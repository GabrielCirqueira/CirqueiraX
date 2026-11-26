<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

use App\DataObject\Pronuncia\PalavraPronunciadaDTO;
use App\DataObject\Pronuncia\SentencaPronunciadaDTO;
use App\DataObject\Pronuncia\TokenTextoDTO;

final readonly class MontadorSentencaPronunciada
{
    private const array PONTUACAO_DE_ABERTURA = ['(', '[', '¿', '¡'];
    private const array CONSOANTES_LIGACAO = ['T', 'D'];
    private const array LETRAS_LIGACAO = ['t', 'd', 'T', 'D'];
    private const string LIGACAO = 'r';
    private const string ESPACO = ' ';

    public function __construct(
        private PalavrasFuncionaisIngles $palavrasFuncionais,
    ) {
    }

    /**
     * @param list<PalavraPronunciadaDTO|TokenTextoDTO> $itens
     */
    public function montar(string $texto, array $itens): SentencaPronunciadaDTO
    {
        $clara = array_map(
            static fn (PalavraPronunciadaDTO|TokenTextoDTO $item): string => $item instanceof PalavraPronunciadaDTO ? $item->figurada() : $item->texto,
            $itens,
        );

        return new SentencaPronunciadaDTO(
            $texto,
            $itens,
            $this->juntar($itens, $clara),
            $this->juntar($itens, $this->falaNatural($itens)),
            $this->juntar($itens, array_map(
                static fn (PalavraPronunciadaDTO|TokenTextoDTO $item): string => $item instanceof PalavraPronunciadaDTO ? $item->simples : $item->texto,
                $itens,
            )),
        );
    }

    /**
     * @param list<PalavraPronunciadaDTO|TokenTextoDTO> $itens
     *
     * @return list<string|null>
     */
    private function falaNatural(array $itens): array
    {
        $textos = $this->aplicarFormasFracas($itens);
        $total = count($itens);

        for ($indice = 0; $indice < $total - 1; ++$indice) {
            $atual = $itens[$indice];
            $seguinte = $itens[$indice + 1];
            if (!$this->isLigavel($atual, $seguinte, $textos[$indice] ?? null)) {
                continue;
            }

            $textoSeguinte = (string) $textos[$indice + 1];
            $primeiraSilaba = explode(PalavraPronunciadaDTO::SEPARADOR_SILABAS, $textoSeguinte)[0];
            $letraLigacao = mb_strtoupper($primeiraSilaba) === $primeiraSilaba ? mb_strtoupper(self::LIGACAO) : self::LIGACAO;
            $textos[$indice + 1] = mb_substr((string) $textos[$indice], 0, -1).PalavraPronunciadaDTO::SEPARADOR_SILABAS.$letraLigacao.$textoSeguinte;
            $textos[$indice] = null;
        }

        return $textos;
    }

    /**
     * @param list<PalavraPronunciadaDTO|TokenTextoDTO> $itens
     *
     * @return list<string|null>
     */
    private function aplicarFormasFracas(array $itens): array
    {
        $ultimaPalavra = $this->indiceUltimaPalavra($itens);
        $textos = [];

        foreach ($itens as $indice => $item) {
            if (!$item instanceof PalavraPronunciadaDTO) {
                $textos[] = $item->texto;

                continue;
            }

            $seguinte = $itens[$indice + 1] ?? null;
            $antesDeVogal = $seguinte instanceof PalavraPronunciadaDTO && $this->comecaComVogal($seguinte);
            $fraca = $indice === $ultimaPalavra ? null : $this->palavrasFuncionais->formaFraca($item->chave, $antesDeVogal);
            $textos[] = $fraca ?? $item->figurada();
        }

        return $textos;
    }

    private function isLigavel(PalavraPronunciadaDTO|TokenTextoDTO $atual, PalavraPronunciadaDTO|TokenTextoDTO $seguinte, ?string $textoAtual): bool
    {
        if (!$atual instanceof PalavraPronunciadaDTO || !$seguinte instanceof PalavraPronunciadaDTO || null === $textoAtual || [] === $atual->fonemas) {
            return false;
        }

        $fonemas = $atual->fonemas;
        $ultimo = FonemasIngles::base($fonemas[array_key_last($fonemas)]);
        $penultimo = $fonemas[count($fonemas) - 2] ?? null;
        $penultimoPermite = null !== $penultimo && (FonemasIngles::isVogal($penultimo) || 'R' === FonemasIngles::base($penultimo));

        return in_array($ultimo, self::CONSOANTES_LIGACAO, true)
            && $penultimoPermite
            && in_array(mb_substr($textoAtual, -1), self::LETRAS_LIGACAO, true)
            && $this->comecaComVogal($seguinte);
    }

    private function comecaComVogal(PalavraPronunciadaDTO $palavra): bool
    {
        return [] !== $palavra->fonemas && FonemasIngles::isVogal($palavra->fonemas[0]);
    }

    /**
     * @param list<PalavraPronunciadaDTO|TokenTextoDTO> $itens
     */
    private function indiceUltimaPalavra(array $itens): ?int
    {
        $ultima = null;
        foreach ($itens as $indice => $item) {
            $ultima = $item instanceof PalavraPronunciadaDTO ? $indice : $ultima;
        }

        return $ultima;
    }

    /**
     * @param list<PalavraPronunciadaDTO|TokenTextoDTO> $itens
     * @param list<string|null>                         $textos
     */
    private function juntar(array $itens, array $textos): string
    {
        $resultado = '';
        foreach ($itens as $indice => $item) {
            $texto = $textos[$indice] ?? null;
            if (null === $texto) {
                continue;
            }

            $resultado .= $this->separadorAntes($item, $resultado).$texto;
        }

        return trim($resultado);
    }

    private function separadorAntes(PalavraPronunciadaDTO|TokenTextoDTO $item, string $acumulado): string
    {
        if ('' === $acumulado || in_array(mb_substr($acumulado, -1), self::PONTUACAO_DE_ABERTURA, true)) {
            return '';
        }

        if ($item instanceof PalavraPronunciadaDTO || in_array($item->texto, self::PONTUACAO_DE_ABERTURA, true)) {
            return self::ESPACO;
        }

        return '';
    }
}
