<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

final class GeradorDicasPronuncia
{
    private const int MAXIMO_DICAS = 3;
    private const array FINAIS_SECOS = ['T', 'D', 'K', 'G', 'P', 'B'];
    private const string DICA_TH_SURDO = 'TH: ponta da língua entre os dentes, soprando o ar. Não é "f" nem "t".';
    private const string DICA_TH_SONORO = 'TH sonoro: língua entre os dentes vibrando, entre um "d" e um "z".';
    private const string DICA_FLAP = 'T ou D entre vogais vira um "r" brando no inglês americano.';
    private const string DICA_FINAL_SECO = 'Termine seco, sem acrescentar "i" no final.';
    private const string DICA_H = 'O "h" é só um sopro, como um "rr" bem leve.';
    private const string DICA_W = 'O "w" soa como um "u" rápido, nunca como "v".';
    private const string DICA_R = 'R americano: dobre a ponta da língua para trás, sem encostar no céu da boca.';
    private const string DICA_I_CURTO = 'É um "i" curto e relaxado (ship), não o "ii" longo (sheep).';
    private const string DICA_I_LONGO = 'É um "i" longo, sorrindo (sheep), não o "i" curto (ship).';
    private const string DICA_AE = 'É um "é" bem aberto, quase um "a" (cat).';
    private const string DICA_NG = 'Termine no "ng" pelo nariz, sem soltar o "g".';
    private const string DICA_L_FINAL = 'L final com a língua no céu da boca; não vira "u".';
    private const string DICA_V = 'V com os dentes de cima no lábio de baixo; não confunda com "b".';

    /**
     * Gera até três dicas para os erros mais comuns de brasileiros, a partir dos fonemas da palavra.
     *
     * @param list<string> $fonemas
     *
     * @return list<string>
     */
    public function gerar(array $fonemas, bool $houveFlap): array
    {
        if ([] === $fonemas) {
            return [];
        }

        $bases = array_map(FonemasIngles::base(...), $fonemas);
        $tonicas = array_map(
            FonemasIngles::base(...),
            array_values(array_filter($fonemas, FonemasIngles::isTonica(...))),
        );
        $ultimo = $bases[array_key_last($bases)];

        $dicas = array_filter([
            in_array('TH', $bases, true) ? self::DICA_TH_SURDO : null,
            in_array('DH', $bases, true) ? self::DICA_TH_SONORO : null,
            $houveFlap ? self::DICA_FLAP : null,
            'HH' === $bases[0] ? self::DICA_H : null,
            'W' === $bases[0] ? self::DICA_W : null,
            in_array('IH', $tonicas, true) ? self::DICA_I_CURTO : null,
            in_array('IY', $tonicas, true) ? self::DICA_I_LONGO : null,
            in_array('AE', $tonicas, true) ? self::DICA_AE : null,
            in_array($ultimo, self::FINAIS_SECOS, true) ? self::DICA_FINAL_SECO : null,
            'NG' === $ultimo ? self::DICA_NG : null,
            'L' === $ultimo ? self::DICA_L_FINAL : null,
            in_array('R', $bases, true) || in_array('ER', $bases, true) ? self::DICA_R : null,
            in_array('V', $bases, true) ? self::DICA_V : null,
        ]);

        return array_slice(array_values($dicas), 0, self::MAXIMO_DICAS);
    }
}
