<?php

declare(strict_types=1);

namespace App\Domain\Pronuncia;

use App\DataObject\Pronuncia\LinhaLetraDTO;

final readonly class LeitorLetraMusica
{
    private const string PADRAO_MARCACAO_TEMPO = '/\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/';
    private const int MS_POR_SEGUNDO = 1000;
    private const int SEGUNDOS_POR_MINUTO = 60;
    private const int CASAS_MILISSEGUNDOS = 3;
    private const int LIMITE_LINHAS = 400;
    private const int TAMANHO_MAXIMO_LINHA = 300;

    /**
     * Lê uma letra no formato LRC ("[01:23.45] texto"). Linhas com várias marcações se repetem em cada tempo; metadados como "[ar: ...]" são ignorados.
     *
     * @return list<LinhaLetraDTO>
     */
    public function lerSincronizada(string $conteudo): array
    {
        $linhas = [];
        foreach ($this->separarLinhas($conteudo) as $linha) {
            if (0 === preg_match_all(self::PADRAO_MARCACAO_TEMPO, $linha, $marcacoes, PREG_SET_ORDER)) {
                continue;
            }

            $texto = $this->limparTexto((string) preg_replace(self::PADRAO_MARCACAO_TEMPO, '', $linha));
            foreach ($marcacoes as $marcacao) {
                $linhas[] = new LinhaLetraDTO($this->milissegundos($marcacao), $texto);
            }
        }

        usort($linhas, static fn (LinhaLetraDTO $a, LinhaLetraDTO $b): int => $a->inicioMs <=> $b->inicioMs);

        return array_slice($this->semPausasRepetidas($linhas), 0, self::LIMITE_LINHAS);
    }

    /**
     * @return list<LinhaLetraDTO>
     */
    public function lerSimples(string $conteudo): array
    {
        $linhas = array_map(
            fn (string $linha): LinhaLetraDTO => new LinhaLetraDTO(null, $this->limparTexto($linha)),
            $this->separarLinhas($conteudo),
        );

        return array_slice($this->semPausasRepetidas($linhas), 0, self::LIMITE_LINHAS);
    }

    /**
     * @return list<string>
     */
    private function separarLinhas(string $conteudo): array
    {
        return preg_split('/\R/u', trim($conteudo)) ?: [];
    }

    private function limparTexto(string $texto): string
    {
        $limpo = trim((string) preg_replace('/\s+/u', ' ', $texto));

        return mb_substr($limpo, 0, self::TAMANHO_MAXIMO_LINHA);
    }

    /**
     * @param array<int, string> $marcacao
     */
    private function milissegundos(array $marcacao): int
    {
        $fracao = str_pad($marcacao[3] ?? '0', self::CASAS_MILISSEGUNDOS, '0');

        return ((int) $marcacao[1] * self::SEGUNDOS_POR_MINUTO + (int) $marcacao[2]) * self::MS_POR_SEGUNDO + (int) $fracao;
    }

    /**
     * @param list<LinhaLetraDTO> $linhas
     *
     * @return list<LinhaLetraDTO>
     */
    private function semPausasRepetidas(array $linhas): array
    {
        $resultado = [];
        foreach ($linhas as $linha) {
            $anterior = $resultado[array_key_last($resultado) ?? 0] ?? null;
            if ('' === $linha->texto && (null === $anterior || '' === $anterior->texto)) {
                continue;
            }
            $resultado[] = $linha;
        }

        while ([] !== $resultado && '' === $resultado[array_key_last($resultado)]->texto) {
            array_pop($resultado);
        }

        return $resultado;
    }
}
