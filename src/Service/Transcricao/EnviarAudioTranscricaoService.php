<?php

declare(strict_types=1);

namespace App\Service\Transcricao;

use App\DataObject\Transcricao\EnviarAudioTranscricaoDTO;
use App\Entity\Transcricao;
use App\Entity\Usuario;
use App\Exception\Transcricao\TranscricaoException;
use App\Interface\ArmazenamentoTranscricaoInterface;
use App\Interface\TranscritorAudioInterface;
use App\Message\TranscreverAudioMessage;
use App\Repository\TranscricaoRepository;
use App\Support\TextoUtil;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final readonly class EnviarAudioTranscricaoService
{
    private const string TITULO_PADRAO = 'Áudio sem nome';
    private const int TAMANHO_MAXIMO_TITULO = 255;
    private const string PADRAO_SEPARADORES_NOME = '/[_\s]+/u';

    public function __construct(
        private TranscricaoRepository $transcricaoRepository,
        private ArmazenamentoTranscricaoInterface $armazenamento,
        private TranscritorAudioInterface $transcritor,
        private MessageBusInterface $messageBus,
        private ValidatorInterface $validator,
    ) {}

    public function executar(EnviarAudioTranscricaoDTO $dto, Usuario $usuario): Transcricao
    {
        $this->validar($dto);
        $arquivo = $dto->arquivo();
        if (null === $arquivo) {
            throw TranscricaoException::arquivoNaoEnviado();
        }

        $transcricao = new Transcricao(
            usuario: $usuario,
            titulo: $this->gerarTitulo($arquivo),
            nomeArquivoOriginal: mb_substr($arquivo->getClientOriginalName(), 0, self::TAMANHO_MAXIMO_TITULO),
            mimeType: $arquivo->getMimeType(),
            tamanhoBytes: $arquivo->getSize() ?: null,
            idiomaSolicitado: $dto->idioma(),
        );

        $caminhoArquivo = $this->armazenamento->salvarAudio($arquivo, $transcricao->uuidTexto());
        $transcricao->anexarAudio($caminhoArquivo, $this->transcritor->medirDuracaoSegundos($caminhoArquivo));

        $this->transcricaoRepository->salvar($transcricao);
        $this->messageBus->dispatch(new TranscreverAudioMessage($transcricao->uuidTexto()));

        return $transcricao;
    }

    private function validar(EnviarAudioTranscricaoDTO $dto): void
    {
        $erros = $this->validator->validate($dto);
        if ($erros->count() > 0) {
            throw TranscricaoException::arquivoInvalido((string) $erros->get(0)->getMessage());
        }
    }

    private function gerarTitulo(UploadedFile $arquivo): string
    {
        $nomeSemExtensao = pathinfo($arquivo->getClientOriginalName(), PATHINFO_FILENAME);
        $titulo = trim((string) preg_replace(self::PADRAO_SEPARADORES_NOME, ' ', $nomeSemExtensao));

        if (TextoUtil::estaEmBranco($titulo)) {
            return self::TITULO_PADRAO;
        }

        return mb_substr($titulo, 0, self::TAMANHO_MAXIMO_TITULO);
    }
}
