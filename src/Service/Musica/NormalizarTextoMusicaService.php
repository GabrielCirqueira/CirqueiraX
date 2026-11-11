<?php

declare(strict_types=1);

namespace App\Service\Musica;

final readonly class NormalizarTextoMusicaService
{
    private const string PREFIXO_MASHUP = 'mashup:';
    private const string SEPARADOR_CHAVE = '|';
    private const string SEPARADOR_COMPONENTES = '+';
    private const int TAMANHO_MAXIMO_CHAVE = 512;
    private const string ALGORITMO_CHAVE_LONGA = 'sha256';
    private const string PADRAO_PARTICIPACAO = '/[\(\[]\s*(feat\.?|ft\.?|with|com|part\.?)\s[^\)\]]*[\)\]]/iu';
    private const string PADRAO_SEPARADORES_ARTISTAS = '/\s*(?:,|&|\sx\s|\sfeat\.?\s|\sft\.?\s|\swith\s|\se\s)\s*/iu';

    public function normalizar(string $texto): string
    {
        $limpo = mb_strtolower(trim($texto), 'UTF-8');
        $semAcentos = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $limpo);
        $limpo = false === $semAcentos ? $limpo : $semAcentos;
        $limpo = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $limpo) ?? $limpo;

        return trim(preg_replace('/\s+/', ' ', $limpo) ?? $limpo);
    }

    public function chaveMusica(string $titulo, string $artistaPrincipal): string
    {
        $tituloSemParticipacao = preg_replace(self::PADRAO_PARTICIPACAO, '', $titulo) ?? $titulo;

        return mb_substr($this->normalizar($tituloSemParticipacao).self::SEPARADOR_CHAVE.$this->normalizar($artistaPrincipal), 0, self::TAMANHO_MAXIMO_CHAVE);
    }

    /**
     * @param list<string> $chavesComponentes
     */
    public function chaveMashup(array $chavesComponentes): string
    {
        $chaves = array_values(array_unique($chavesComponentes));
        sort($chaves);

        $chave = self::PREFIXO_MASHUP.implode(self::SEPARADOR_COMPONENTES, $chaves);
        if (strlen($chave) <= self::TAMANHO_MAXIMO_CHAVE) {
            return $chave;
        }

        return self::PREFIXO_MASHUP.hash(self::ALGORITMO_CHAVE_LONGA, $chave);
    }

    /**
     * @return list<string>
     */
    public function separarArtistas(string $texto): array
    {
        $partes = preg_split(self::PADRAO_SEPARADORES_ARTISTAS, trim($texto)) ?: [];

        return array_values(array_filter(array_map('trim', $partes), static fn (string $nome): bool => '' !== $nome));
    }
}
