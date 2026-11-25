<?php

declare(strict_types=1);

namespace App\Infra\Pronuncia;

use App\Exception\Pronuncia\PronunciaException;
use App\Interface\LeitorDicionarioPronunciaInterface;

final readonly class LeitorDicionarioCmuClient implements LeitorDicionarioPronunciaInterface
{
    private const string MARCADOR_COMENTARIO = '#';
    private const string EXPRESSAO_VARIANTE = '/^(.+)\((\d+)\)$/';
    private const int VARIANTE_PADRAO = 1;
    private const int TAMANHO_MAXIMO_PALAVRA = 80;

    public function __construct(
        private string $caminhoDicionario,
    ) {
    }

    public function ler(): iterable
    {
        if (!is_readable($this->caminhoDicionario)) {
            throw PronunciaException::dicionarioNaoEncontrado($this->caminhoDicionario);
        }

        $arquivo = new \SplFileObject($this->caminhoDicionario);
        while (!$arquivo->eof()) {
            $entrada = $this->interpretarLinha((string) $arquivo->fgets());
            if (null !== $entrada) {
                yield $entrada;
            }
        }
    }

    /**
     * @return array{palavra: string, variante: int, fonemas: string}|null
     */
    private function interpretarLinha(string $linha): ?array
    {
        $conteudo = trim(explode(self::MARCADOR_COMENTARIO, $linha, 2)[0]);
        $partes = preg_split('/\s+/', $conteudo, 2);
        if (false === $partes || 2 !== count($partes)) {
            return null;
        }

        [$palavra, $fonemas] = $partes;
        $variante = self::VARIANTE_PADRAO;
        if (1 === preg_match(self::EXPRESSAO_VARIANTE, $palavra, $grupos)) {
            $palavra = $grupos[1];
            $variante = (int) $grupos[2];
        }

        if (mb_strlen($palavra) > self::TAMANHO_MAXIMO_PALAVRA) {
            return null;
        }

        return ['palavra' => mb_strtolower($palavra), 'variante' => $variante, 'fonemas' => trim($fonemas)];
    }
}
