<?php

declare(strict_types=1);

namespace App\Service\Audio;

use App\DataObject\ArquivoMidiaDTO;
use App\DataObject\PaginacaoDTO;
use App\DataObject\PaginaAudiosDTO;
use App\Entity\Audio;
use App\Entity\Usuario;
use App\Exception\Audio\AudioException;
use App\Interface\ArmazenamentoInterface;
use App\Repository\AudioRepository;
use App\Support\TextoUtil;

final readonly class ConsultarAudiosService
{
    private const string MIME_MP3 = 'audio/mpeg';
    private const string EXTENSAO_MP3 = 'mp3';
    private const string NOME_ARQUIVO_PADRAO = 'audio';
    private const string PADRAO_CARACTERES_INVALIDOS = '/[\\\\\/:*?"<>|]+/u';

    public function __construct(
        private AudioRepository $audioRepository,
        private ArmazenamentoInterface $armazenamento,
    ) {}

    public function listarDoUsuario(Usuario $usuario, PaginacaoDTO $paginacao): PaginaAudiosDTO
    {
        return $this->audioRepository->paginarDoUsuario($usuario, $paginacao->pagina(), $paginacao->limite());
    }

    public function obterArquivo(string $uuid, Usuario $usuario): ArquivoMidiaDTO
    {
        $audio = $this->audioRepository->buscarDoUsuario($uuid, $usuario);
        if (null === $audio) {
            throw AudioException::audioNaoEncontrado();
        }

        $caminhoArquivo = (string) $audio->caminhoArquivo();
        if (!$audio->isDisponivel() || !$this->armazenamento->existe($caminhoArquivo)) {
            throw AudioException::arquivoDoAudioIndisponivel();
        }

        return new ArquivoMidiaDTO(
            caminhoFisico: $caminhoArquivo,
            nomeArquivo: $this->gerarNomeArquivo($audio),
            mimeType: self::MIME_MP3,
        );
    }

    private function gerarNomeArquivo(Audio $audio): string
    {
        $titulo = trim((string) preg_replace(self::PADRAO_CARACTERES_INVALIDOS, ' ', (string) $audio->titulo()));
        $nome = TextoUtil::estaEmBranco($titulo) ? self::NOME_ARQUIVO_PADRAO : $titulo;

        return sprintf('%s.%s', $nome, self::EXTENSAO_MP3);
    }
}
