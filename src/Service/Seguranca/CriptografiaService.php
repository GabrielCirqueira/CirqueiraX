<?php

declare(strict_types=1);

namespace App\Service\Seguranca;

use App\Interface\CriptografiaInterface;

final class CriptografiaService implements CriptografiaInterface
{
    private readonly string $chaveDerivada;

    public function __construct(string $chaveSecreta)
    {
        $this->chaveDerivada = hash('sha256', $chaveSecreta, true);
    }

    public function criptografar(string $textoPlano): string
    {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $conteudoCriptografado = sodium_crypto_secretbox($textoPlano, $nonce, $this->chaveDerivada);

        return base64_encode($nonce . $conteudoCriptografado);
    }

    public function descriptografar(string $textoCriptografado): string
    {
        $binario = base64_decode($textoCriptografado, true);

        if (false === $binario || strlen($binario) <= SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
            throw new \InvalidArgumentException('Formato do conteúdo criptografado é inválido.');
        }

        $nonce = substr($binario, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $conteudoCriptografado = substr($binario, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);

        $textoPlano = sodium_crypto_secretbox_open($conteudoCriptografado, $nonce, $this->chaveDerivada);

        if (false === $textoPlano) {
            throw new \RuntimeException('Falha ao descriptografar: conteúdo corrompido ou chave incorreta.');
        }

        return $textoPlano;
    }
}
