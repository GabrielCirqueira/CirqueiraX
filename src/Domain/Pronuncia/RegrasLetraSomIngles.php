<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

final class RegrasLetraSomIngles
{
    private const array GRAFEMAS = [
        'tion' => ['SH', 'AH0', 'N'], 'sion' => ['ZH', 'AH0', 'N'], 'ough' => ['AO'], 'augh' => ['AO'], 'eigh' => ['EY'],
        'igh' => ['AY'], 'tch' => ['CH'], 'dge' => ['JH'], 'ture' => ['CH', 'ER0'],
        'ph' => ['F'], 'sh' => ['SH'], 'ch' => ['CH'], 'th' => ['TH'], 'wh' => ['W'], 'ck' => ['K'], 'ng' => ['NG'],
        'qu' => ['K', 'W'], 'ee' => ['IY'], 'ea' => ['IY'], 'oo' => ['UW'], 'ou' => ['AW'], 'ow' => ['OW'],
        'oi' => ['OY'], 'oy' => ['OY'], 'ai' => ['EY'], 'ay' => ['EY'], 'au' => ['AO'], 'aw' => ['AO'],
        'ie' => ['IY'], 'ei' => ['EY'], 'ue' => ['UW'], 'ew' => ['UW'], 'er' => ['ER'], 'ir' => ['ER'],
        'ur' => ['ER'], 'or' => ['AO', 'R'], 'ar' => ['AA', 'R'],
        'a' => ['AE'], 'e' => ['EH'], 'i' => ['IH'], 'o' => ['AA'], 'u' => ['AH'], 'b' => ['B'], 'd' => ['D'],
        'f' => ['F'], 'g' => ['G'], 'h' => ['HH'], 'j' => ['JH'], 'k' => ['K'], 'l' => ['L'], 'm' => ['M'],
        'n' => ['N'], 'p' => ['P'], 'r' => ['R'], 's' => ['S'], 't' => ['T'], 'v' => ['V'], 'w' => ['W'],
        'x' => ['K', 'S'], 'z' => ['Z'],
    ];
    private const array INICIOS_MUDOS = ['kn' => ['N'], 'wr' => ['R'], 'ps' => ['S'], 'gn' => ['N']];
    private const array VOGAL_LONGA = ['a' => 'EY', 'e' => 'IY', 'i' => 'AY', 'o' => 'OW', 'u' => 'UW', 'y' => 'AY'];
    private const string VOGAIS_LETRAS = 'aeiouy';
    private const string LETRAS_C_SUAVE = 'eiy';
    private const int TAMANHO_MAXIMO_GRAFEMA = 4;
    private const int TAMANHO_MINIMO_E_MUDO = 3;

    /**
     * Palpite de fonemas pela escrita, para palavras fora do dicionário. Sempre devolve algo: é a última camada da cascata.
     *
     * @return list<string>
     */
    public function aproximar(string $palavra): array
    {
        $letras = (string) preg_replace('/[^a-z]/', '', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT', $palavra) ?: $palavra));
        if ('' === $letras) {
            return [];
        }

        [$letras, $vogalLonga] = $this->tratarEMudo($letras);
        $fonemas = $this->converterLetras($letras, $vogalLonga);

        return FonemasIngles::garantirTonica($this->acentuarVogais($fonemas));
    }

    /**
     * @return array{0: string, 1: int|null}
     */
    private function tratarEMudo(string $letras): array
    {
        $tamanho = strlen($letras);
        if ($tamanho < self::TAMANHO_MINIMO_E_MUDO || !str_ends_with($letras, 'e')) {
            return [$letras, null];
        }

        $semE = substr($letras, 0, -1);
        $posicaoVogal = $tamanho - 3;
        $temPadraoVCe = $posicaoVogal >= 0
            && str_contains(self::VOGAIS_LETRAS, $letras[$posicaoVogal])
            && !str_contains(self::VOGAIS_LETRAS, $letras[$tamanho - 2]);

        return [$semE, $temPadraoVCe ? $posicaoVogal : null];
    }

    /**
     * @return list<string>
     */
    private function converterLetras(string $letras, ?int $vogalLonga): array
    {
        $fonemas = [];
        $posicao = 0;
        $tamanho = strlen($letras);

        foreach (self::INICIOS_MUDOS as $inicio => $som) {
            if (str_starts_with($letras, $inicio)) {
                $fonemas = $som;
                $posicao = strlen($inicio);
            }
        }

        while ($posicao < $tamanho) {
            [$som, $avanco] = $this->proximoSom($letras, $posicao, $vogalLonga);
            array_push($fonemas, ...$som);
            $posicao += $avanco;
        }

        return $fonemas;
    }

    /**
     * @return array{0: list<string>, 1: int}
     */
    private function proximoSom(string $letras, int $posicao, ?int $vogalLonga): array
    {
        $letra = $letras[$posicao];
        $seguinte = $letras[$posicao + 1] ?? '';

        if ($posicao === $vogalLonga && isset(self::VOGAL_LONGA[$letra])) {
            return [[self::VOGAL_LONGA[$letra]], 1];
        }

        if ($letra === $seguinte && !str_contains(self::VOGAIS_LETRAS, $letra)) {
            return [self::GRAFEMAS[$letra] ?? [], 2];
        }

        for ($tamanho = self::TAMANHO_MAXIMO_GRAFEMA; $tamanho >= 2; --$tamanho) {
            $grafema = substr($letras, $posicao, $tamanho);
            if (strlen($grafema) === $tamanho && isset(self::GRAFEMAS[$grafema])) {
                return [self::GRAFEMAS[$grafema], $tamanho];
            }
        }

        return [$this->somDeLetraSolta($letra, $seguinte, 0 === $posicao), 1];
    }

    /**
     * @return list<string>
     */
    private function somDeLetraSolta(string $letra, string $seguinte, bool $inicio): array
    {
        if ('c' === $letra) {
            return '' !== $seguinte && str_contains(self::LETRAS_C_SUAVE, $seguinte) ? ['S'] : ['K'];
        }

        if ('y' === $letra) {
            return $inicio ? ['Y'] : ['IY'];
        }

        return self::GRAFEMAS[$letra] ?? [];
    }

    /**
     * @param list<string> $fonemas
     *
     * @return list<string>
     */
    private function acentuarVogais(array $fonemas): array
    {
        $primeiraVogal = true;

        return array_map(static function (string $fonema) use (&$primeiraVogal): string {
            if (!FonemasIngles::isVogal($fonema) || ctype_digit(substr($fonema, -1))) {
                return $fonema;
            }

            $acento = $primeiraVogal ? FonemasIngles::TONICA : FonemasIngles::ATONA;
            $primeiraVogal = false;

            return $fonema.$acento;
        }, $fonemas);
    }
}
