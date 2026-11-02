<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\DataObject\UploadLivroAudioDTO;
use App\Entity\LivroAudio;
use App\Entity\Usuario;
use App\Exception\LivroAudio\LivroAudioException;
use App\Interface\ArmazenamentoLivroInterface;
use App\Repository\LivroAudioRepository;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final readonly class UploadLivroAudioService
{
    private const string TITULO_PADRAO = 'Livro Sem Título';

    public function __construct(
        private LivroAudioRepository $livroAudioRepository,
        private ArmazenamentoLivroInterface $armazenamentoLivro,
        private ValidatorInterface $validator,
    ) {}

    public function executar(UploadLivroAudioDTO $dto, Usuario $usuario): LivroAudio
    {
        $erros = $this->validator->validate($dto);
        if ($erros->count() > 0) {
            $primeiroErro = $erros->get(0);
            throw LivroAudioException::arquivoInvalido($primeiroErro->getMessage());
        }

        $arquivo = $dto->arquivo();
        if (null === $arquivo) {
            throw LivroAudioException::arquivoNaoEnviado();
        }

        $tituloOriginal = $dto->titulo() ?? pathinfo($arquivo->getClientOriginalName(), PATHINFO_FILENAME);
        $titulo = '' !== trim($tituloOriginal) ? trim($tituloOriginal) : self::TITULO_PADRAO;
        $tamanhoBytes = $arquivo->getSize() ?: null;

        $livro = new LivroAudio(
            usuario: $usuario,
            titulo: $titulo,
            tamanhoBytes: $tamanhoBytes,
        );

        $caminhoPdf = $this->armazenamentoLivro->salvarPdf($arquivo, $livro->uuidTexto());
        $totalPaginas = $this->armazenamentoLivro->contarPaginasPdf($caminhoPdf);

        $livro->definirCaminhoPdf($caminhoPdf, $tamanhoBytes);
        $livro->definirTotalPaginas($totalPaginas);

        $this->livroAudioRepository->salvar($livro);

        return $livro;
    }
}
