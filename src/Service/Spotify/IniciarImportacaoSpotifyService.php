<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\UploadImportacaoSpotifyDTO;
use App\Entity\ImportacaoSpotify;
use App\Entity\Usuario;
use App\Exception\Spotify\SpotifyException;
use App\Interface\ArmazenamentoImportacaoSpotifyInterface;
use App\Message\ImportarHistoricoSpotifyMessage;
use App\Repository\ImportacaoSpotifyRepository;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Uid\Uuid;

final readonly class IniciarImportacaoSpotifyService
{
    private const int TAMANHO_MAXIMO_BYTES = 104857600; // 100 MB
    private const array EXTENSOES_VALIDAS = ['zip', 'json'];

    public function __construct(
        private ImportacaoSpotifyRepository $importacaoRepository,
        private ArmazenamentoImportacaoSpotifyInterface $armazenamento,
        private MessageBusInterface $messageBus,
    ) {}

    public function executar(UploadImportacaoSpotifyDTO $dto, Usuario $usuario): ImportacaoSpotify
    {
        $arquivo = $dto->arquivo();
        if (null === $arquivo) {
            throw SpotifyException::arquivoImportacaoNaoEnviado();
        }

        $tamanho = (int) $arquivo->getSize();
        if ($tamanho > self::TAMANHO_MAXIMO_BYTES) {
            throw SpotifyException::tamanhoArquivoExcedido(self::TAMANHO_MAXIMO_BYTES);
        }

        $extensao = mb_strtolower((string) $arquivo->getClientOriginalExtension());
        if (!in_array($extensao, self::EXTENSOES_VALIDAS, true)) {
            throw SpotifyException::tipoArquivoNaoSuportado();
        }

        $emAndamento = $this->importacaoRepository->buscarEmAndamentoPorUsuario($usuario);
        if (null !== $emAndamento) {
            throw SpotifyException::importacaoJaEmAndamento();
        }

        $uuid = Uuid::v7();
        $caminhoSalvo = $this->armazenamento->salvarArquivoTemporario($arquivo, $uuid->toRfc4122());

        $importacao = new ImportacaoSpotify(
            usuario: $usuario,
            caminhoArquivo: $caminhoSalvo,
            nomeArquivoOriginal: (string) $arquivo->getClientOriginalName(),
            tamanhoBytes: $tamanho,
            uuid: $uuid,
        );

        $this->importacaoRepository->salvar($importacao);
        $this->messageBus->dispatch(new ImportarHistoricoSpotifyMessage($uuid->toRfc4122()));

        return $importacao;
    }
}
