<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\Entity\Usuario;
use App\Exception\Spotify\SpotifyException;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final readonly class EstadoAutorizacaoSpotifyService
{
    public const int VALIDADE_SEGUNDOS = 900;

    public function __construct(
        #[Autowire('%kernel.secret%')]
        private string $segredo,
    ) {
    }

    public function gerar(Usuario $usuario): string
    {
        $conteudo = sprintf('%d.%d.%s', (int) $usuario->getId(), time() + self::VALIDADE_SEGUNDOS, bin2hex(random_bytes(8)));

        return $this->codificar($conteudo).'.'.$this->assinar($conteudo);
    }

    public function validar(Usuario $usuario, string $estado): void
    {
        $partes = explode('.', $estado);
        if (2 !== count($partes)) {
            throw SpotifyException::stateInvalidoOuExpirado();
        }

        $conteudo = $this->decodificar($partes[0]);
        if (null === $conteudo || !hash_equals($this->assinar($conteudo), $partes[1])) {
            throw SpotifyException::stateInvalidoOuExpirado();
        }

        $campos = explode('.', $conteudo);
        if (3 !== count($campos)) {
            throw SpotifyException::stateInvalidoOuExpirado();
        }

        [$usuarioId, $expiraEm] = $campos;
        if ($usuarioId !== (string) $usuario->getId() || (int) $expiraEm < time()) {
            throw SpotifyException::stateInvalidoOuExpirado();
        }
    }

    private function assinar(string $conteudo): string
    {
        return $this->codificar(hash_hmac('sha256', 'spotify-oauth|'.$conteudo, $this->segredo, true));
    }

    private function codificar(string $valor): string
    {
        return rtrim(strtr(base64_encode($valor), '+/', '-_'), '=');
    }

    private function decodificar(string $valor): ?string
    {
        $resultado = base64_decode(strtr($valor, '-_', '+/'), true);

        return false === $resultado ? null : $resultado;
    }
}
