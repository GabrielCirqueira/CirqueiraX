<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

final readonly class LimpezaTextoPdfService
{
    private const string PADRAO_HIFEN_FINAL_LINHA = '/(\p{L}+)-\s*\n\s*(\p{L}+)/u';
    private const string PADRAO_NUMEROS_PAGINA_ISOLADOS = '/^\s*\d+\s*$/m';
    private const string PADRAO_CARACTERES_CONTROLE = '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/';
    private const string PADRAO_ESPACOS_MULTIPLOS = '/[ \t]{2,}/';
    private const string PADRAO_QUEBRAS_EXCESSIVAS = '/\n{3,}/';

    private const array MAPA_LIGADURAS = [
        'ﬁ' => 'fi',
        'ﬂ' => 'fl',
        'ﬀ' => 'ff',
        'ﬃ' => 'ffi',
        'ﬄ' => 'ffl',
        '’' => "'",
        '‘' => "'",
        '“' => '"',
        '”' => '"',
        '–' => '-',
        '—' => ' - ',
        '…' => '...',
    ];

    public function limparTexto(string $textoCru): string
    {
        $texto = str_replace(["\r\n", "\r"], "\n", $textoCru);

        $texto = strtr($texto, self::MAPA_LIGADURAS);

        $texto = (string) preg_replace(self::PADRAO_CARACTERES_CONTROLE, '', $texto);

        $texto = (string) preg_replace(self::PADRAO_HIFEN_FINAL_LINHA, '$1$2', $texto);

        $texto = (string) preg_replace(self::PADRAO_NUMEROS_PAGINA_ISOLADOS, '', $texto);

        $linhas = explode("\n", $texto);
        $linhasNormalizadas = [];

        foreach ($linhas as $linha) {
            $linhaLimpa = trim((string) preg_replace(self::PADRAO_ESPACOS_MULTIPLOS, ' ', $linha));
            if ('' !== $linhaLimpa) {
                $linhasNormalizadas[] = $linhaLimpa;
            }
        }

        $textoFinal = implode("\n", $linhasNormalizadas);

        $textoFinal = (string) preg_replace(self::PADRAO_QUEBRAS_EXCESSIVAS, "\n\n", $textoFinal);

        return trim($textoFinal);
    }
}
