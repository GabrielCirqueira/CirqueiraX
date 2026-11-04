<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\DataObject\PaginaPdfDTO;
use App\Entity\LivroAudio;
use App\Exception\Pdf\ExtratorPdfException;
use App\Interface\ExtratorTextoPdfInterface;
use Psr\Log\LoggerInterface;

final readonly class ExtrairTextoNarracaoLivroService
{
    public function __construct(
        private ExtratorTextoPdfInterface $extratorTexto,
        private LimpezaTextoPdfService $limpezaTexto,
        private MontarTextoNarracaoLivroService $montarTextoNarracao,
        private LoggerInterface $logger,
    ) {}

    /**
     * @return array<int, string>
     */
    public function executar(LivroAudio $livro): array
    {
        $caminhoPdf = $livro->caminhoPdf();
        if (null === $caminhoPdf || !file_exists($caminhoPdf)) {
            throw ExtratorPdfException::arquivoNaoEncontrado($caminhoPdf ?? '');
        }

        $textosCrus = $this->extrairComLayout($livro, $caminhoPdf);
        $textos = [];

        for ($pagina = 1; $pagina <= $livro->totalPaginas(); ++$pagina) {
            $textoCru = null !== $textosCrus
                ? ($textosCrus[$pagina] ?? '')
                : $this->extratorTexto->extrairTextoDaPagina($caminhoPdf, $pagina);
            $textos[$pagina] = $this->limpezaTexto->limparTexto($textoCru);
        }

        return $textos;
    }

    /**
     * @param array<int, string> $textos
     */
    public function textoDoIntervalo(array $textos, int $paginaInicio, int $paginaFim): string
    {
        $partes = [];
        for ($pagina = $paginaInicio; $pagina <= $paginaFim; ++$pagina) {
            $texto = $textos[$pagina] ?? '';
            if ('' !== $texto) {
                $partes[] = $texto;
            }
        }

        $texto = trim(implode("\n\n", $partes));

        return '' !== $texto ? $texto : sprintf('Páginas %d a %d.', $paginaInicio, $paginaFim);
    }

    /**
     * @return array<int, string>|null
     */
    private function extrairComLayout(LivroAudio $livro, string $caminhoPdf): ?array
    {
        try {
            $paginas = $this->extratorTexto->extrairLayoutDoDocumento($caminhoPdf);
        } catch (ExtratorPdfException $e) {
            $this->logger->warning('Falha ao extrair o layout do PDF; usando a extração por página.', [
                'livroUuid' => $livro->uuidTexto(),
                'erro' => $e->getMessage(),
            ]);

            return null;
        }

        $possuiTexto = array_any($paginas, static fn(PaginaPdfDTO $pagina): bool => [] !== $pagina->linhas);

        return $possuiTexto ? $this->montarTextoNarracao->montar($paginas, $livro->modoNotas()) : null;
    }
}
