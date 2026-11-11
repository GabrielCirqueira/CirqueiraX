<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\Entity\ImportacaoYoutube;
use App\Entity\Usuario;
use App\Exception\ImportacaoYoutube\ImportacaoYoutubeException;
use App\Message\ImportarHistoricoYoutubeMessage;
use App\Repository\ImportacaoYoutubeRepository;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class CancelarClassificacaoImportacaoYoutubeService
{
    public function __construct(
        private ImportacaoYoutubeRepository $importacaoRepository,
        private MessageBusInterface $messageBus,
    ) {
    }

    public function executar(string $uuid, Usuario $usuario): ImportacaoYoutube
    {
        $importacao = $this->importacaoRepository->buscarDoUsuario($usuario, $uuid) ?? throw ImportacaoYoutubeException::importacaoNaoEncontrada();

        if (!$importacao->isAguardandoConfirmacao()) {
            throw ImportacaoYoutubeException::semConfirmacaoPendente();
        }

        $importacao->pularClassificacao();
        $this->importacaoRepository->salvar($importacao);
        $this->messageBus->dispatch(new ImportarHistoricoYoutubeMessage($importacao->uuid()->toRfc4122()));

        return $importacao;
    }
}
