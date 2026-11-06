<?php

declare(strict_types=1);

namespace App\Service\Transcricao;

use App\DataObject\ArquivoMidiaDTO;
use App\DataObject\Transcricao\FiltroTranscricoesDTO;
use App\DataObject\Transcricao\PaginaTranscricoesDTO;
use App\DataObject\Transcricao\ResumoTranscricoesDTO;
use App\Entity\Transcricao;
use App\Entity\Usuario;
use App\Exception\Transcricao\TranscricaoException;
use App\Interface\ArmazenamentoTranscricaoInterface;
use App\Repository\TranscricaoRepository;

final readonly class ConsultarTranscricoesService
{
    private const string MIME_PADRAO = 'application/octet-stream';

    public function __construct(
        private TranscricaoRepository $transcricaoRepository,
        private ArmazenamentoTranscricaoInterface $armazenamento,
    ) {}

    public function listarDoUsuario(Usuario $usuario, FiltroTranscricoesDTO $filtro): PaginaTranscricoesDTO
    {
        return $this->transcricaoRepository->paginarDoUsuario($usuario, $filtro);
    }

    public function resumirDoUsuario(Usuario $usuario): ResumoTranscricoesDTO
    {
        return $this->transcricaoRepository->calcularResumoDoUsuario($usuario);
    }

    public function obterDoUsuario(string $uuid, Usuario $usuario): Transcricao
    {
        $transcricao = $this->transcricaoRepository->buscarDoUsuario($uuid, $usuario);
        if (null === $transcricao) {
            throw TranscricaoException::transcricaoNaoEncontrada();
        }

        return $transcricao;
    }

    public function obterArquivoAudio(string $uuid, Usuario $usuario): ArquivoMidiaDTO
    {
        $transcricao = $this->obterDoUsuario($uuid, $usuario);
        $caminhoArquivo = (string) $transcricao->caminhoArquivo();

        if (!$transcricao->isAudioDisponivel() || !$this->armazenamento->existe($caminhoArquivo)) {
            throw TranscricaoException::audioIndisponivel();
        }

        return new ArquivoMidiaDTO(
            caminhoFisico: $caminhoArquivo,
            nomeArquivo: $transcricao->nomeArquivoOriginal(),
            mimeType: $transcricao->mimeType() ?? self::MIME_PADRAO,
        );
    }
}
