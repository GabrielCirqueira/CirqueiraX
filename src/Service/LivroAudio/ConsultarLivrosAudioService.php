<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\DataObject\ArquivoMidiaDTO;
use App\Entity\LivroAudio;
use App\Entity\LivroAudioBloco;
use App\Entity\LivroAudioBlocoVoz;
use App\Entity\Usuario;
use App\Exception\LivroAudio\LivroAudioException;
use App\Interface\ArmazenamentoLivroInterface;
use App\Repository\LivroAudioBlocoRepository;
use App\Repository\LivroAudioBlocoVozRepository;
use App\Repository\LivroAudioRepository;

final readonly class ConsultarLivrosAudioService
{
    private const string EXTENSAO_PDF = '.pdf';
    private const string MIME_TYPE_PDF = 'application/pdf';
    private const string MIME_TYPE_AUDIO = 'audio/mpeg';

    public function __construct(
        private LivroAudioRepository $livroAudioRepository,
        private LivroAudioBlocoRepository $livroAudioBlocoRepository,
        private ArmazenamentoLivroInterface $armazenamentoLivro,
        private LivroAudioBlocoVozRepository $livroAudioBlocoVozRepository,
        private ResolverVozLivroAudioService $resolverVoz,
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

    public function obterArquivoBloco(string $uuid, int $numeroBloco, Usuario $usuario, ?string $voz = null): ArquivoMidiaDTO
    {
        $livro = $this->obterDoUsuario($uuid, $usuario);
        $audio = $this->buscarAudioDoBloco($livro, $numeroBloco, $voz);

        $caminhoAudio = $audio->caminhoAudio();
        if (null === $caminhoAudio || !file_exists($caminhoAudio) || !is_readable($caminhoAudio)) {
            throw LivroAudioException::audioBlocoNaoDisponivel($numeroBloco);
        }

        $nomeArquivo = sprintf('livro_%s_bloco_%d.mp3', $livro->uuidTexto(), $numeroBloco);

        return new ArquivoMidiaDTO(
            caminhoFisico: $caminhoAudio,
            nomeArquivo: $nomeArquivo,
            mimeType: self::MIME_TYPE_AUDIO,
        );
    }

    /**
     * @return list<array{inicio: float, fim: float, texto: string, palavras?: list<array{inicio: float, fim: float, texto: string}>}>
     */
    public function listarTrechosDoBloco(string $uuid, int $numeroBloco, Usuario $usuario, ?string $voz = null): array
    {
        $livro = $this->obterDoUsuario($uuid, $usuario);

        return $this->buscarAudioDoBloco($livro, $numeroBloco, $voz)->trechos();
    }

    private function buscarAudioDoBloco(LivroAudio $livro, int $numeroBloco, ?string $voz): LivroAudioBloco|LivroAudioBlocoVoz
    {
        $bloco = $this->livroAudioBlocoRepository->buscarPorLivroENumero($livro, $numeroBloco);
        if (null === $bloco) {
            throw LivroAudioException::blocoNaoEncontrado($numeroBloco);
        }

        if (null === $voz || '' === $voz || $voz === $this->resolverVoz->vozPrincipal($livro)) {
            return $bloco;
        }

        $blocoVoz = $this->livroAudioBlocoVozRepository->buscarPorBlocoEVoz($bloco, $voz);
        if (null === $blocoVoz || !$blocoVoz->isPronto()) {
            throw LivroAudioException::audioBlocoNaoDisponivel($numeroBloco);
        }

        return $blocoVoz;
    }

    /**
     * @return list<LivroAudioBloco>
     */
    public function listarBlocosDoLivro(string $uuid, Usuario $usuario): array
    {
        $livro = $this->obterDoUsuario($uuid, $usuario);

        return $this->livroAudioBlocoRepository->listarPorLivro($livro);
    }
}
