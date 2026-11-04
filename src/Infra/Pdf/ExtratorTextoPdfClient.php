<?php

declare(strict_types=1);

namespace App\Infra\Pdf;

use App\DataObject\LinhaPdfDTO;
use App\DataObject\PaginaPdfDTO;
use App\Exception\Pdf\ExtratorPdfException;
use App\Interface\ExtratorTextoPdfInterface;
use Symfony\Component\Process\Process;

final class ExtratorTextoPdfClient implements ExtratorTextoPdfInterface
{
    private const float TIMEOUT_EXTRACAO_SEGUNDOS = 30.0;
    private const string ENCODING_UTF8 = 'UTF-8';
    private const float TIMEOUT_LAYOUT_SEGUNDOS = 300.0;
    private const string PADRAO_PAGINA = '/<page\b[^>]*\bheight="([\d.]+)"[^>]*>(.*?)<\/page>/s';
    private const string PADRAO_BLOCO = '/<block\b[^>]*>(.*?)<\/block>/s';
    private const string PADRAO_LINHA = '/<line\b[^>]*\byMin="([\d.]+)"[^>]*\byMax="([\d.]+)"[^>]*>(.*?)<\/line>/s';
    private const string PADRAO_PALAVRA = '/<word\b[^>]*\byMin="([\d.]+)"[^>]*\byMax="([\d.]+)"[^>]*>(.*?)<\/word>/s';

    public function extrairTextoDaPagina(string $caminhoPdf, int $numeroPagina): string
    {
        $this->validarArquivo($caminhoPdf);

        if ($numeroPagina <= 0) {
            throw ExtratorPdfException::paginaInvalida($numeroPagina);
        }

        $comando = [
            'pdftotext',
            '-f',
            (string) $numeroPagina,
            '-l',
            (string) $numeroPagina,
            '-enc',
            self::ENCODING_UTF8,
            '-layout',
            $caminhoPdf,
            '-',
        ];

        $processo = new Process($comando);
        $processo->setTimeout(self::TIMEOUT_EXTRACAO_SEGUNDOS);
        $processo->run();

        if (!$processo->isSuccessful()) {
            throw ExtratorPdfException::falhaAoExecutarExtracao($processo->getErrorOutput());
        }

        return trim($processo->getOutput());
    }

    /**
     * @return array<int, string>
     */
    public function extrairTextoDeIntervalo(string $caminhoPdf, int $paginaInicio, int $paginaFim): array
    {
        $this->validarArquivo($caminhoPdf);

        if ($paginaInicio <= 0) {
            throw ExtratorPdfException::paginaInvalida($paginaInicio);
        }

        if ($paginaInicio > $paginaFim) {
            throw ExtratorPdfException::intervaloInvalido($paginaInicio, $paginaFim);
        }

        $resultado = [];

        for ($pagina = $paginaInicio; $pagina <= $paginaFim; ++$pagina) {
            $resultado[$pagina] = $this->extrairTextoDaPagina($caminhoPdf, $pagina);
        }

        return $resultado;
    }

    public function extrairLayoutDoDocumento(string $caminhoPdf): array
    {
        $this->validarArquivo($caminhoPdf);

        $processo = new Process(['pdftotext', '-bbox-layout', '-enc', self::ENCODING_UTF8, $caminhoPdf, '-']);
        $processo->setTimeout(self::TIMEOUT_LAYOUT_SEGUNDOS);
        $processo->run();

        if (!$processo->isSuccessful()) {
            throw ExtratorPdfException::falhaAoExecutarExtracao($processo->getErrorOutput());
        }

        preg_match_all(self::PADRAO_PAGINA, $processo->getOutput(), $paginas, PREG_SET_ORDER);

        $resultado = [];
        foreach ($paginas as $indice => [, $altura, $conteudo]) {
            $resultado[] = new PaginaPdfDTO(
                numero: $indice + 1,
                altura: (float) $altura,
                linhas: $this->extrairLinhas($conteudo),
            );
        }

        return $resultado;
    }

    /**
     * @return list<LinhaPdfDTO>
     */
    private function extrairLinhas(string $conteudoPagina): array
    {
        preg_match_all(self::PADRAO_BLOCO, $conteudoPagina, $blocos);

        $linhas = [];
        foreach ($blocos[1] as $indiceBloco => $conteudoBloco) {
            preg_match_all(self::PADRAO_LINHA, $conteudoBloco, $linhasBloco, PREG_SET_ORDER);

            foreach ($linhasBloco as [, $yMin, $yMax, $conteudoLinha]) {
                $palavras = $this->extrairPalavras($conteudoLinha);
                if ([] === $palavras) {
                    continue;
                }

                $linhas[] = new LinhaPdfDTO(
                    palavras: $palavras,
                    yMin: (float) $yMin,
                    yMax: (float) $yMax,
                    bloco: $indiceBloco,
                );
            }
        }

        return $linhas;
    }

    /**
     * @return list<array{texto: string, altura: float}>
     */
    private function extrairPalavras(string $conteudoLinha): array
    {
        preg_match_all(self::PADRAO_PALAVRA, $conteudoLinha, $palavras, PREG_SET_ORDER);

        $resultado = [];
        foreach ($palavras as [, $yMin, $yMax, $texto]) {
            $textoDecodificado = trim(html_entity_decode($texto, ENT_QUOTES | ENT_XML1, self::ENCODING_UTF8));
            if ('' === $textoDecodificado) {
                continue;
            }

            $resultado[] = [
                'texto' => $textoDecodificado,
                'altura' => (float) $yMax - (float) $yMin,
            ];
        }

        return $resultado;
    }

    private function validarArquivo(string $caminhoPdf): void
    {
        if (!file_exists($caminhoPdf) || !is_readable($caminhoPdf)) {
            throw ExtratorPdfException::arquivoNaoEncontrado($caminhoPdf);
        }
    }
}
