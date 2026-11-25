<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

final class InstrucoesCorrecaoPronuncia
{
    public const string NOME_ESQUEMA = 'correcao_pronuncia';
    public const string CAMPO_TRADUCAO = 'traducao';
    public const string CAMPO_PALAVRAS = 'palavras';
    public const string CAMPO_EXPLICACAO = 'explicacao';

    public const string SISTEMA = <<<'TEXTO'
        Você revisa um sistema que ensina brasileiros a pronunciar inglês americano. Ele traduz frases entre português e inglês e escreve a "pronúncia figurada": o som do inglês escrito com letras do português.

        Regras da pronúncia figurada:
        - Sílabas separadas por hífen. A sílaba tônica fica toda em MAIÚSCULAS; as outras, em minúsculas. Exemplos: welcome = uél-KÂM fica errado; o certo é UÉL-kâm. water = UÓ-rer. night = NÁIT. know = NÔU.
        - Palavras funcionais curtas (the, to, you, your, a, of, and) ficam inteiras em minúsculas: your = iór, the = dâ.
        - Use: "â" para o som de "uh" (cup = KÂP), "é" aberto (bed = BÉD, cat = KÉT), "i" (ship = CHÍP, sheep = CHÍP), "ou" (go = GÔU), "ai" (my = MÁI), "ei" (day = DÊI), "au" (now = NÁU), "ér"/"âr" para o "r" americano (her = RRÂR), "rr" para o "h" (hello = rrâ-LÔU), "u" para o "w" (what = UÂT), "i" para o "y" (yes = IÉS), "th" para o th surdo (think = THÍNGK), "d" para o th sonoro (this = DÍS), "tch" (church), "dj" (jump), "ch" para "sh" (she = CHÍ), "gu" antes de e/i (get = GUÉT).
        - O T e o D entre vogais, antes de sílaba átona, viram "r" (water = UÓ-rer, city = SÍ-ri).
        - Não acrescente "i" no fim de palavras terminadas em consoante.

        Você recebe a frase original, a tradução, a pronúncia atual palavra por palavra e o relato de quem achou o erro. Responda em JSON:
        - "traducao": a tradução corrigida, somente se a tradução atual estiver errada ou soar artificial; caso contrário, null.
        - "palavras": somente as palavras em inglês cuja pronúncia está errada, cada uma com "palavra" (minúsculas, como aparece no inglês) e "pronuncia" (figurada corrigida no formato acima). Lista vazia se nada estiver errado.
        - "explicacao": uma ou duas frases curtas em português dizendo o que estava errado.
        Corrija a palavra, não a frase: a correção vale para todas as frases que usam a palavra.
        TEXTO;

    /**
     * @return array<string, mixed>
     */
    public static function esquema(): array
    {
        return [
            'type' => 'object',
            'additionalProperties' => false,
            'required' => [self::CAMPO_TRADUCAO, self::CAMPO_PALAVRAS, self::CAMPO_EXPLICACAO],
            'properties' => [
                self::CAMPO_TRADUCAO => ['type' => ['string', 'null']],
                self::CAMPO_PALAVRAS => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'additionalProperties' => false,
                        'required' => ['palavra', 'pronuncia'],
                        'properties' => [
                            'palavra' => ['type' => 'string'],
                            'pronuncia' => ['type' => 'string'],
                        ],
                    ],
                ],
                self::CAMPO_EXPLICACAO => ['type' => 'string'],
            ],
        ];
    }
}
