<?php

declare(strict_types=1);

namespace App\Infra\Json;

use App\Interface\LeitorStreamObjetosJsonInterface;
use Generator;

final readonly class LeitorStreamObjetosJson implements LeitorStreamObjetosJsonInterface
{
    private const int TAMANHO_BLOCO_LEITURA = 65536;

    public function ler($stream): Generator
    {
        $buffer = '';
        $emString = false;
        $escapado = false;
        $nivelChaves = 0;

        while (!feof($stream)) {
            $bloco = fread($stream, self::TAMANHO_BLOCO_LEITURA);
            if (false === $bloco || '' === $bloco) {
                break;
            }

            $tamanho = strlen($bloco);

            for ($i = 0; $i < $tamanho; ++$i) {
                $caractere = $bloco[$i];

                if ($emString) {
                    $buffer .= $caractere;

                    if ($escapado) {
                        $escapado = false;
                    } elseif ('\\' === $caractere) {
                        $escapado = true;
                    } elseif ('"' === $caractere) {
                        $emString = false;
                    }

                    continue;
                }

                if ('"' === $caractere) {
                    $emString = true;
                    if ($nivelChaves > 0) {
                        $buffer .= $caractere;
                    }

                    continue;
                }

                if ('{' === $caractere) {
                    ++$nivelChaves;
                    $buffer .= $caractere;

                    continue;
                }

                if ('}' === $caractere) {
                    --$nivelChaves;
                    $buffer .= $caractere;

                    if (0 === $nivelChaves) {
                        /** @var mixed $dadosDecodificados */
                        $dadosDecodificados = json_decode($buffer, true);
                        $buffer = '';

                        if (is_array($dadosDecodificados)) {
                            /** @var array<string, mixed> $dadosDecodificados */
                            yield $dadosDecodificados;
                        }
                    }

                    continue;
                }

                if ($nivelChaves > 0) {
                    $buffer .= $caractere;
                }
            }
        }
    }
}
