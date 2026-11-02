<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\DataObject\ArquivoMidiaDTO;
use App\Entity\LivroAudio;
use App\Entity\Usuario;
use App\Exception\LivroAudio\LivroAudioException;
use App\Interface\ArmazenamentoLivroInterface;
use App\Repository\LivroAudioRepository;

final readonly class ConsultarLivrosAudioService
{
    private const string EXTENSAO_PDF = '.pdf';
    private const string MIME_TYPE_PDF = 'application/pdf';

    public function __construct(
        private LivroAudioRepository $livroAudioRepository,
        private ArmazenamentoLivroInterface $armazenamentoLivro,
    ) {}

    /**
     * @return list<LivroAudio>
     */
    public function listarDoUsuario(Usuario $usuario): array
    {
        return $this->livroAudioRepository->listarDoUsuario($usuario);
    }

    public function obterDoUsuario(string $uuid, Usuario $usuario): LivroAudio
    {
        $livro = $this->livroAudioRepository->buscarDoUsuario($uuid, $usuario);
        if (null === $livro) {
            throw LivroAudioException::livroNaoEncontrado($uuid);
        }

        return $livro;
    }

    public function obterArquivoPdf(string $uuid, Usuario $usuario): ArquivoMidiaDTO
    {
        $livro = $this->obterDoUsuario($uuid, $usuario);
        $caminhoPdf = $livro->caminhoPdf() ?? $this->armazenamentoLivro->obterCaminhoPdf($uuid);

        if (!file_exists($caminhoPdf) || !is_readable($caminhoPdf)) {
            throw LivroAudioException::arquivoPdfNaoEncontrado($caminhoPdf);
        }

        $nomeArquivo = sprintf('%s%s', preg_replace('/[^a-zA-Z0-9_\-]/', '_', $livro->titulo()), self::EXTENSAO_PDF);

        return new ArquivoMidiaDTO(
            caminhoFisico: $caminhoPdf,
            nomeArquivo: $nomeArquivo,
            mimeType: self::MIME_TYPE_PDF,
        );
    }
}
