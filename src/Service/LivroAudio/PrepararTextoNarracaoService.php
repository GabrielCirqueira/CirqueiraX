<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

final readonly class PrepararTextoNarracaoService
{
    private const float PROPORCAO_LINHA_CHEIA = 0.9;
    private const float PROPORCAO_FIM_PARAGRAFO = 0.75;
    private const float PROPORCAO_TITULO = 0.5;
    private const string PADRAO_FIM_FRASE = '/[.!?:]["\')\]]*$/u';
    private const string PADRAO_INICIO_MAIUSCULO = '/^["\'(\[]*\p{Lu}/u';

    public function preparar(string $texto): string
    {
        $linhas = $this->extrairLinhas($texto);
        if ([] === $linhas) {
            return '';
        }

        $larguraReferencia = $this->calcularLarguraReferencia($linhas);
        $paragrafos = [];
        $paragrafoAtual = '';

        foreach ($linhas as $indice => $linha) {
            $iniciaParagrafo = '' === $paragrafoAtual;
            $paragrafoAtual = $iniciaParagrafo ? $linha : $paragrafoAtual . ' ' . $linha;
            $proximaLinha = $linhas[$indice + 1] ?? null;
            $largura = mb_strlen($linha);
            $terminaFrase = 1 === preg_match(self::PADRAO_FIM_FRASE, $linha);

            $fechaParagrafo = $terminaFrase && $largura < $larguraReferencia * self::PROPORCAO_FIM_PARAGRAFO;
            $ehTitulo = $iniciaParagrafo
                && !$terminaFrase
                && $largura < $larguraReferencia * self::PROPORCAO_TITULO
                && null !== $proximaLinha
                && 1 === preg_match(self::PADRAO_INICIO_MAIUSCULO, $proximaLinha);

            if (null === $proximaLinha || $fechaParagrafo || $ehTitulo) {
                $paragrafos[] = $ehTitulo ? $paragrafoAtual . '.' : $paragrafoAtual;
                $paragrafoAtual = '';
            }
        }

        return implode("\n", $paragrafos);
    }

    /**
     * @return list<string>
     */
    private function extrairLinhas(string $texto): array
    {
        $linhas = array_map('trim', explode("\n", $texto));

        return array_values(array_filter($linhas, static fn(string $linha): bool => '' !== $linha));
    }

    /**
     * @param list<string> $linhas
     */
    private function calcularLarguraReferencia(array $linhas): float
    {
        $larguras = array_map('mb_strlen', $linhas);
        sort($larguras);

        return (float) $larguras[(int) floor((count($larguras) - 1) * self::PROPORCAO_LINHA_CHEIA)];
    }
}
