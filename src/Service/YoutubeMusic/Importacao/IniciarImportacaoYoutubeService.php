<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\DataObject\YoutubeMusic\UploadImportacaoYoutubeDTO;
use App\Entity\ImportacaoYoutube;
use App\Entity\Usuario;
use App\Exception\ImportacaoYoutube\ImportacaoYoutubeException;
use App\Interface\ArmazenamentoImportacaoYoutubeInterface;
use App\Message\ImportarHistoricoYoutubeMessage;
use App\Repository\ImportacaoYoutubeRepository;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Uid\Uuid;

final readonly class IniciarImportacaoYoutubeService
{
    public const int TAMANHO_MAXIMO_BYTES = 209715200;
    public const int LIMITE_FILA = 5;
    private const array EXTENSOES_VALIDAS = ['zip', 'json'];

    public function __construct(
        private ImportacaoYoutubeRepository $importacaoRepository,
        private ArmazenamentoImportacaoYoutubeInterface $armazenamento,
        private MessageBusInterface $messageBus,
    ) {
    }

    public function executar(UploadImportacaoYoutubeDTO $dto, Usuario $usuario): ImportacaoYoutube
    {
        $arquivo = $dto->arquivo;
        if (null === $arquivo || !$arquivo->isValid()) {
            throw ImportacaoYoutubeException::arquivoNaoEnviado();
        }

        $tamanho = (int) $arquivo->getSize();
        if ($tamanho > self::TAMANHO_MAXIMO_BYTES) {
            throw ImportacaoYoutubeException::tamanhoExcedido(self::TAMANHO_MAXIMO_BYTES);
        }

        if (!in_array(mb_strtolower($arquivo->getClientOriginalExtension()), self::EXTENSOES_VALIDAS, true)) {
            throw ImportacaoYoutubeException::tipoNaoSuportado();
        }

        if ($this->importacaoRepository->contarEmAndamento($usuario) >= self::LIMITE_FILA) {
            throw ImportacaoYoutubeException::filaCheia(self::LIMITE_FILA);
        }

        $uuid = Uuid::v7();
        $caminho = $this->armazenamento->salvarArquivoTemporario($arquivo, $uuid->toRfc4122());
        $importacao = new ImportacaoYoutube($usuario, $caminho, $arquivo->getClientOriginalName(), $tamanho, $uuid);
        $this->importacaoRepository->salvar($importacao);
        $this->messageBus->dispatch(new ImportarHistoricoYoutubeMessage($uuid->toRfc4122()));

        return $importacao;
    }
}
