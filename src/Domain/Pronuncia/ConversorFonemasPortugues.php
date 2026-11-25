<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

final readonly class ConversorFonemasPortugues
{
    private const array VOGAIS = [
        'AA' => ['a', 'á'], 'AE' => ['é', 'é'], 'AH' => ['â', 'â'], 'AO' => ['ó', 'ó'], 'AW' => ['au', 'áu'],
        'AY' => ['ai', 'ái'], 'EH' => ['é', 'é'], 'ER' => ['er', 'âr'], 'EY' => ['ei', 'êi'], 'IH' => ['i', 'í'],
        'IY' => ['i', 'í'], 'OW' => ['ou', 'ôu'], 'OY' => ['ói', 'ói'], 'UH' => ['u', 'ú'], 'UW' => ['u', 'ú'],
    ];
    private const array CONSOANTES = [
        'B' => 'b', 'CH' => 'tch', 'D' => 'd', 'DH' => 'd', 'F' => 'f', 'G' => 'g', 'HH' => 'rr', 'JH' => 'dj',
        'K' => 'k', 'L' => 'l', 'M' => 'm', 'N' => 'n', 'NG' => 'ng', 'P' => 'p', 'R' => 'r', 'S' => 's',
        'SH' => 'ch', 'T' => 't', 'TH' => 'th', 'V' => 'v', 'W' => 'u', 'Y' => 'i', 'Z' => 'z', 'ZH' => 'j',
    ];
    private const array VOGAIS_QUE_PEDEM_GU = ['EH', 'EY', 'IH', 'IY', 'AE', 'ER'];
    private const array CONSOANTES_FLAP = ['T', 'D'];
    private const string FLAP = 'r';
    private const string G_ANTES_DE_E_I = 'gu';
    private const int INDICE_FORMA_ATONA = 0;
    private const int INDICE_FORMA_TONICA = 1;

    public function __construct(
        private SeparadorSilabasFonemas $separador,
    ) {
    }

    /**
     * Converte fonemas ARPAbet na grafia figurada em português. A sílaba tônica sai em maiúsculas, exceto em palavras funcionais (the, to, you...), que ficam todas em minúsculas.
     *
     * @param list<string> $fonemas
     *
     * @return array{silabas: list<string>, tonica: int|null, flap: bool}
     */
    public function converter(array $fonemas, bool $funcional): array
    {
        $silabasFonemas = $this->separador->separar($fonemas);
        $silabas = [];
        $tonica = null;
        $houveFlap = false;
        $anterior = null;

        foreach ($silabasFonemas as $indice => $silaba) {
            $tonicaAqui = !$funcional && $this->contemTonica($silaba);
            $flap = $indice > 0 && $this->isFlap($silaba, $anterior);
            $houveFlap = $houveFlap || $flap;
            $texto = $this->renderizarSilaba($silaba, $tonicaAqui, $flap);
            $silabas[] = $tonicaAqui ? mb_strtoupper($texto) : $texto;
            $tonica = $tonicaAqui && null === $tonica ? $indice : $tonica;
            $anterior = $silaba[array_key_last($silaba)] ?? null;
        }

        return ['silabas' => $silabas, 'tonica' => $tonica, 'flap' => $houveFlap];
    }

    /**
     * @param list<string> $silaba
     */
    private function contemTonica(array $silaba): bool
    {
        foreach ($silaba as $fonema) {
            if (FonemasIngles::isTonica($fonema)) {
                return true;
            }
        }

        return false;
    }

    /**
     * O T e o D americanos viram um "r" brando entre vogais quando a sílaba seguinte é átona: water = UÓ-rer.
     *
     * @param list<string> $silaba
     */
    private function isFlap(array $silaba, ?string $fonemaAnterior): bool
    {
        if (null === $fonemaAnterior || count($silaba) < 2) {
            return false;
        }

        $primeiro = FonemasIngles::base($silaba[0]);
        $anteriorPermiteFlap = FonemasIngles::isVogal($fonemaAnterior) || 'R' === FonemasIngles::base($fonemaAnterior);

        return in_array($primeiro, self::CONSOANTES_FLAP, true)
            && $anteriorPermiteFlap
            && FonemasIngles::isVogal($silaba[1])
            && FonemasIngles::TONICA !== FonemasIngles::acento($silaba[1]);
    }

    /**
     * @param list<string> $silaba
     */
    private function renderizarSilaba(array $silaba, bool $tonica, bool $flap): string
    {
        $texto = '';
        foreach ($silaba as $posicao => $fonema) {
            $texto .= $this->renderizarFonema($fonema, $silaba[$posicao + 1] ?? null, $tonica, $flap && 0 === $posicao);
        }

        return $texto;
    }

    private function renderizarFonema(string $fonema, ?string $seguinte, bool $tonica, bool $flap): string
    {
        $base = FonemasIngles::base($fonema);
        if (isset(self::VOGAIS[$base])) {
            $forma = $tonica && FonemasIngles::isTonica($fonema) ? self::INDICE_FORMA_TONICA : self::INDICE_FORMA_ATONA;

            return self::VOGAIS[$base][$forma];
        }

        if ($flap) {
            return self::FLAP;
        }

        if ('G' === $base && null !== $seguinte && in_array(FonemasIngles::base($seguinte), self::VOGAIS_QUE_PEDEM_GU, true)) {
            return self::G_ANTES_DE_E_I;
        }

        return self::CONSOANTES[$base] ?? mb_strtolower($base);
    }
}
