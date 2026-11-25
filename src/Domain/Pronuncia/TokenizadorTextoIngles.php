<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

use App\DataObject\Pronuncia\TokenTextoDTO;

final readonly class TokenizadorTextoIngles
{
    private const string EXPRESSAO_SENTENCAS = '/(?<=[.!?…])\s+|\R+/u';
    private const string EXPRESSAO_TOKENS = "/\\p{L}+(?:['’]\\p{L}+)*|[0-9]+|[^\\s\\p{L}0-9]/u";
    private const string EXPRESSAO_LETRA = '/^\p{L}/u';
    private const string EXPRESSAO_DIGITO = '/^[0-9]+$/';
    private const string EXPRESSAO_MOEDA = '/([$€£])\s?([0-9]+)/u';
    private const string EXPRESSAO_SEPARADOR_MILHAR = '/(?<=\d),(?=\d{3}\b)/';
    private const string EXPRESSAO_HIFEN_ENTRE_LETRAS = '/(?<=\p{L})[-‐–](?=\p{L})/u';
    private const array MOEDAS = ['$' => 'dollars', '€' => 'euros', '£' => 'pounds'];
    private const array SIMBOLOS = ['%' => ' percent ', '&' => ' and ', '+' => ' plus ', '@' => ' at ', '=' => ' equals ', '#' => ' number '];
    private const array ASPAS = ['’' => "'", '‘' => "'", '“' => '"', '”' => '"'];

    public function __construct(
        private NumeroPorExtensoIngles $numeroPorExtenso,
    ) {
    }

    /**
     * Divide o texto em sentenças e cada sentença em palavras e pontuação.
     * Números, moedas e símbolos já saem escritos por extenso em inglês.
     *
     * @return list<array{texto: string, tokens: list<TokenTextoDTO>}>
     */
    public function tokenizar(string $texto): array
    {
        $normalizado = $this->normalizar($texto);
        $sentencas = [];

        foreach (preg_split(self::EXPRESSAO_SENTENCAS, $normalizado) ?: [] as $sentenca) {
            $sentenca = trim($sentenca);
            if ('' === $sentenca) {
                continue;
            }

            $tokens = $this->tokensDaSentenca($sentenca);
            if ([] !== $tokens) {
                $sentencas[] = ['texto' => $sentenca, 'tokens' => $tokens];
            }
        }

        return $sentencas;
    }

    private function normalizar(string $texto): string
    {
        $texto = strtr($texto, self::ASPAS);
        $texto = (string) preg_replace(self::EXPRESSAO_SEPARADOR_MILHAR, '', $texto);
        $texto = (string) preg_replace_callback(
            self::EXPRESSAO_MOEDA,
            static fn (array $partes): string => $partes[2].' '.self::MOEDAS[$partes[1]],
            $texto,
        );
        $texto = (string) preg_replace(self::EXPRESSAO_HIFEN_ENTRE_LETRAS, ' ', $texto);

        return strtr($texto, self::SIMBOLOS);
    }

    /**
     * @return list<TokenTextoDTO>
     */
    private function tokensDaSentenca(string $sentenca): array
    {
        preg_match_all(self::EXPRESSAO_TOKENS, $sentenca, $encontrados);
        $tokens = [];

        foreach ($encontrados[0] as $pedaco) {
            array_push($tokens, ...$this->converterPedaco($pedaco));
        }

        return $tokens;
    }

    /**
     * @return list<TokenTextoDTO>
     */
    private function converterPedaco(string $pedaco): array
    {
        if (1 === preg_match(self::EXPRESSAO_DIGITO, $pedaco)) {
            $palavras = explode(' ', $this->numeroPorExtenso->converter($pedaco));

            return array_map(static fn (string $palavra): TokenTextoDTO => new TokenTextoDTO($palavra, true), $palavras);
        }

        return [new TokenTextoDTO($pedaco, 1 === preg_match(self::EXPRESSAO_LETRA, $pedaco))];
    }
}
