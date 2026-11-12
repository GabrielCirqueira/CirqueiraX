<?php

declare(strict_types=1);

namespace App\Service\Notificacao;

use App\DataObject\CriarNotificacaoDTO;
use App\Entity\Notificacao;
use App\Entity\Usuario;
use App\Exception\Notificacao\NotificacaoException;
use App\Repository\NotificacaoRepository;
use App\Repository\UsuarioRepository;

final readonly class CriarNotificacaoService
{
    private const int TAMANHO_MAXIMO_TITULO = 160;

    public function __construct(
        private NotificacaoRepository $notificacaoRepository,
        private UsuarioRepository $usuarioRepository,
    ) {
    }

    public function executar(CriarNotificacaoDTO $dto): int
    {
        $titulo = trim($dto->titulo);
        $mensagem = trim($dto->mensagem);
        if ('' === $titulo || mb_strlen($titulo) > self::TAMANHO_MAXIMO_TITULO) {
            throw NotificacaoException::tituloInvalido(self::TAMANHO_MAXIMO_TITULO);
        }

        if ('' === $mensagem) {
            throw NotificacaoException::mensagemVazia();
        }

        $usuarios = $this->destinatarios($dto->usuarioId);
        foreach ($usuarios as $usuario) {
            $this->notificacaoRepository->salvar(new Notificacao($usuario, $dto->tipo, $titulo, $mensagem), flush: false);
        }
        $this->notificacaoRepository->flush();

        return count($usuarios);
    }

    /**
     * @return list<Usuario>
     */
    private function destinatarios(?int $usuarioId): array
    {
        if (null === $usuarioId) {
            return array_values($this->usuarioRepository->findAll());
        }

        $usuario = $this->usuarioRepository->find($usuarioId);
        if (null === $usuario) {
            throw NotificacaoException::usuarioNaoEncontrado($usuarioId);
        }

        return [$usuario];
    }
}
