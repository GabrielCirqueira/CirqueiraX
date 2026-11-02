<?php

declare(strict_types=1);

namespace App\Infra\Pdf;

use App\Exception\Pdf\ExtratorPdfException;
use App\Interface\ExtratorTextoPdfInterface;
use Symfony\Component\Process\Process;

final class ExtratorTextoPdfClient implements ExtratorTextoPdfInterface
{
    private const float TIMEOUT_EXTRACAO_SEGUNDOS = 30.0;
    private const string ENCODING_UTF8 = 'UTF-8';

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

    private function validarArquivo(string $caminhoPdf): void
    {
        if (!file_exists($caminhoPdf) || !is_readable($caminhoPdf)) {
            throw ExtratorPdfException::arquivoNaoEncontrado($caminhoPdf);
        }
    }
}
