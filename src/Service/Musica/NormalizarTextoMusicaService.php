<?php

declare(strict_types=1);

namespace App\Service\Musica;

use Normalizer;

final readonly class NormalizarTextoMusicaService
{
    private const string PREFIXO_MASHUP = 'mashup:';
    private const string SEPARADOR_CHAVE = '|';
    private const string SEPARADOR_COMPONENTES = '+';
    private const int TAMANHO_MAXIMO_CHAVE = 512;
    private const string ALGORITMO_CHAVE_LONGA = 'sha256';
    private const string PADRAO_ROTULOS = 'slowed|reverb|sped\s*up|speed\s*up|nightcore|8d|lyrics?|letra|legendad[oa]|tradu[cç][aã]o|tiktok|visuali[sz]er|official|oficial|audio|áudio|video|vídeo|hd|4k|remaster(?:ed)?|remix|edit|version|vers[aã]o|live|ao vivo|acoustic|ac[uú]stic[oa]|instrumental|cover|extended|radio|mono|stereo version|feat\.?|ft\.?|with|com|part\.?';
    private const string PADRAO_PARTICIPACAO = '/[\(\[]\s*(feat\.?|ft\.?|with|com|part\.?)\s[^\)\]]*[\)\]]/iu';
    private const string PADRAO_SEPARADORES_ARTISTAS = '/\s*(?:,|&|\sx\s|\sfeat\.?\s|\sft\.?\s|\swith\s|\se\s)\s*/iu';
    private const string PADRAO_LETRAS_ESPACADAS = '/(?<![\p{L}\p{N}])(?:[\p{L}\p{N}] ){2,}[\p{L}\p{N}](?![\p{L}\p{N}])/u';

    public function normalizar(string $texto): string
    {
        $limpo = mb_strtolower(trim($this->compatibilizar($texto)), 'UTF-8');
        $limpo = str_replace('&', ' and ', $limpo);
        $decomposto = Normalizer::normalize($limpo, Normalizer::FORM_D);
        $limpo = preg_replace('/\p{Mn}/u', '', false === $decomposto ? $limpo : $decomposto) ?? $limpo;
        $limpo = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $limpo) ?? $limpo;
        $limpo = trim(preg_replace('/\s+/', ' ', $limpo) ?? $limpo);

        return preg_replace_callback(self::PADRAO_LETRAS_ESPACADAS, static fn (array $trecho): string => str_replace(' ', '', $trecho[0]), $limpo) ?? $limpo;
    }

    private function compatibilizar(string $texto): string
    {
        $compativel = Normalizer::normalize($texto, Normalizer::FORM_KC);

        return false === $compativel ? $texto : $compativel;
    }

    public function normalizarTitulo(string $titulo): string
    {
        $semParenteses = preg_replace('/[\(\[][^\)\]]*\b(?:'.self::PADRAO_ROTULOS.')\b[^\)\]]*[\)\]]/iu', ' ', $titulo) ?? $titulo;
        $semSufixo = preg_replace('/\s+-\s+[^-]*\b(?:'.self::PADRAO_ROTULOS.')\b[^-]*$/iu', ' ', $semParenteses) ?? $semParenteses;
        $normalizado = $this->normalizar($semSufixo);

        return '' === $normalizado ? $this->normalizar($titulo) : $normalizado;
    }

    public function chaveMusica(string $titulo, string $artistaPrincipal): string
    {
        $tituloSemParticipacao = preg_replace(self::PADRAO_PARTICIPACAO, '', $titulo) ?? $titulo;

        return mb_substr($this->normalizarTitulo($tituloSemParticipacao).self::SEPARADOR_CHAVE.$this->normalizar($artistaPrincipal), 0, self::TAMANHO_MAXIMO_CHAVE);
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

    public function tituloDaChave(string $chave): string
    {
        return explode(self::SEPARADOR_CHAVE, $chave, 2)[0];
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
