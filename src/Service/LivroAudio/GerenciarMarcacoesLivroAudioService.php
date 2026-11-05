<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\DataObject\AtualizarMarcacaoLivroDTO;
use App\DataObject\CriarMarcacaoLivroDTO;
use App\Entity\LivroAudio;
use App\Entity\MarcacaoLivroAudio;
use App\Entity\Usuario;
use App\Enum\TipoMarcacaoLivroAudio;
use App\Exception\LivroAudio\LivroAudioException;
use App\Repository\MarcacaoLivroAudioRepository;

final readonly class GerenciarMarcacoesLivroAudioService
{
    private const int LIMITE_MARCACOES_POR_LIVRO = 2000;

    public function __construct(
        private ConsultarLivrosAudioService $consultarLivrosAudio,
        private MarcacaoLivroAudioRepository $marcacaoRepository,
    ) {}

    /**
     * @return list<MarcacaoLivroAudio>
     */
    public function listar(string $livroUuid, Usuario $usuario): array
    {
        return $this->marcacaoRepository->listarDoLivro($this->consultarLivrosAudio->obterDoUsuario($livroUuid, $usuario));
    }

    public function criar(string $livroUuid, CriarMarcacaoLivroDTO $dto, Usuario $usuario): MarcacaoLivroAudio
    {
        $livro = $this->consultarLivrosAudio->obterDoUsuario($livroUuid, $usuario);
        $this->validarCriacao($livro, $dto);

        $marcacao = new MarcacaoLivroAudio(
            livro: $livro,
            tipo: $dto->tipo(),
            pagina: min($dto->pagina, max(1, $livro->totalPaginas())),
            numeroBloco: $dto->numeroBloco,
            indiceTrecho: $dto->indiceTrecho,
            segundos: $dto->segundos,
            texto: $dto->textoLimpo(),
            nota: $dto->notaLimpa(),
            retangulos: $dto->retangulosNormalizados(),
        );
        $this->marcacaoRepository->salvar($marcacao);

        return $marcacao;
    }

    public function atualizar(string $livroUuid, string $marcacaoUuid, AtualizarMarcacaoLivroDTO $dto, Usuario $usuario): MarcacaoLivroAudio
    {
        $marcacao = $this->obter($livroUuid, $marcacaoUuid, $usuario);
        if (TipoMarcacaoLivroAudio::NOTA === $marcacao->tipo() && null === $dto->notaLimpa()) {
            throw LivroAudioException::notaVazia();
        }

        $marcacao->atualizarNota($dto->notaLimpa());
        $this->marcacaoRepository->salvar($marcacao);

        return $marcacao;
    }

    public function remover(string $livroUuid, string $marcacaoUuid, Usuario $usuario): void
    {
        $this->marcacaoRepository->remover($this->obter($livroUuid, $marcacaoUuid, $usuario));
    }

    private function obter(string $livroUuid, string $marcacaoUuid, Usuario $usuario): MarcacaoLivroAudio
    {
        $livro = $this->consultarLivrosAudio->obterDoUsuario($livroUuid, $usuario);

        return $this->marcacaoRepository->buscarDoLivro($livro, $marcacaoUuid)
            ?? throw LivroAudioException::marcacaoNaoEncontrada($marcacaoUuid);
    }

    private function validarCriacao(LivroAudio $livro, CriarMarcacaoLivroDTO $dto): void
    {
        if (TipoMarcacaoLivroAudio::NOTA === $dto->tipo() && null === $dto->notaLimpa()) {
            throw LivroAudioException::notaVazia();
        }

        if ($this->marcacaoRepository->contarDoLivro($livro) >= self::LIMITE_MARCACOES_POR_LIVRO) {
            throw LivroAudioException::limiteMarcacoes(self::LIMITE_MARCACOES_POR_LIVRO);
        }
    }
}
