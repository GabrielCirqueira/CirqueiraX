<?php

declare(strict_types=1);

namespace App\Exception\TransferenciaPlaylist;

use DomainException;

final class TransferenciaPlaylistException extends DomainException
{
    public static function transferenciaNaoEncontrada(): self
    {
        return new self('A transferência de playlist solicitada não foi encontrada.', 404);
    }

    public static function vinculoNaoEncontrado(): self
    {
        return new self('O vínculo de playlist solicitado não foi encontrado.', 404);
    }

    public static function servicoOrigemInvalido(): self
    {
        return new self('O serviço de origem informado para a transferência de playlist é inválido.', 400);
    }

    public static function servicoDestinoInvalido(): self
    {
        return new self('O serviço de destino informado para a transferência de playlist é inválido.', 400);
    }

    public static function origemEDestinoIguais(): self
    {
        return new self('A origem e o destino da transferência de playlist devem ser serviços diferentes.', 400);
    }

    public static function nenhumaPlaylistSelecionada(): self
    {
        return new self('É necessário selecionar ao menos uma playlist para iniciar a transferência.', 400);
    }

    public static function contaSpotifyNecessaria(): self
    {
        return new self('É necessário conectar uma conta Spotify antes de transferir playlists.', 400);
    }

    public static function escoposPlaylistSpotifyAusentes(): self
    {
        return new self('Reconecte o Spotify em Gerenciar para autorizar a leitura e alteração de playlists.', 403);
    }

    public static function contaYoutubeOAuthNecessaria(): self
    {
        return new self('É necessário autorizar o YouTube OAuth antes de transferir playlists.', 400);
    }

    public static function transferenciaNaoEditavel(): self
    {
        return new self('Esta transferência de playlist não pode ser editada no status atual.', 409);
    }

    public static function transferenciaNaoEstaEmPrevia(): self
    {
        return new self('A confirmação da prévia só é permitida quando a transferência está no status de prévia.', 409);
    }

    public static function transferenciaNaoPodeExecutar(): self
    {
        return new self('A execução da transferência só é permitida a partir da prévia ou quando pausada por cota.', 409);
    }

    public static function remocoesExcedemLimiteSeguranca(): self
    {
        return new self('A sincronização removeria mais de 30% das faixas. Informe force=true para confirmar a operação.', 409);
    }

    public static function playlistOrigemNaoEncontrada(string $idExterno): self
    {
        return new self(sprintf('A playlist de origem com identificador %s não foi encontrada.', $idExterno), 404);
    }

    public static function falhaAoCasarFaixas(): self
    {
        return new self('Ocorreu uma falha ao casar as faixas da transferência de playlist.', 500);
    }

    public static function falhaAoExecutarTransferencia(): self
    {
        return new self('Ocorreu uma falha ao executar a transferência de playlist.', 500);
    }

    public static function decisaoDestinoInvalida(): self
    {
        return new self('A decisão de destino informada para a playlist é inválida.', 400);
    }
}
