<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

use App\DataObject\Pronuncia\CorrecaoPalavraPronunciaDTO;
use App\Exception\Pronuncia\PronunciaException;

final class ValidadorCorrecaoPronuncia
{
    private const string EXPRESSAO_PALAVRA = "/^[a-z]+(?:'[a-z]+)*$/";
    private const string EXPRESSAO_PRONUNCIA = "/^[\\p{L}']+(?:-[\\p{L}']+)*$/u";
    private const string EXPRESSAO_ESPACOS = '/\s+/u';
    private const int TAMANHO_MAXIMO_PRONUNCIA = 120;

    /**
     * Normaliza e valida a correção: palavra em minúsculas e pronúncia com sílabas separadas por hífen.
     *
     * @throws PronunciaException
     */
    public function normalizar(CorrecaoPalavraPronunciaDTO $correcao): CorrecaoPalavraPronunciaDTO
    {
        $palavra = mb_strtolower(trim(str_replace('’', "'", $correcao->palavra)));
        if (1 !== preg_match(self::EXPRESSAO_PALAVRA, $palavra)) {
            throw PronunciaException::palavraInvalida();
        }

        $pronuncia = (string) preg_replace(self::EXPRESSAO_ESPACOS, '-', trim($correcao->pronuncia));
        if (mb_strlen($pronuncia) > self::TAMANHO_MAXIMO_PRONUNCIA || 1 !== preg_match(self::EXPRESSAO_PRONUNCIA, $pronuncia)) {
            throw PronunciaException::pronunciaInvalida($palavra);
        }

        return new CorrecaoPalavraPronunciaDTO($palavra, $pronuncia);
    }
}
