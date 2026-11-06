<?php

declare(strict_types=1);

namespace App\Exception\Spotify;

final class SpotifyException extends \DomainException
{
    public static function limiteRequisicoesExcedido(int $segundosEspera): self
    {
        return new self(sprintf('Limite de requisições da API do Spotify excedido. Tente novamente em %d segundos.', $segundosEspera), 429);
    }

    public static function tokenInvalidoOuExpirado(): self
    {
        return new self('O token de autenticação do Spotify é inválido ou expirou.', 401);
    }

    public static function contaNaoAutorizadaNoModoDesenvolvimento(): self
    {
        return new self('A conta Spotify não possui permissão ou não foi adicionada à lista de usuários do modo de desenvolvimento.', 403);
    }

    public static function falhaNaTrocaDeCodigoPorTokens(): self
    {
        return new self('Ocorreu uma falha ao tentar trocar o código de autorização pelos tokens de acesso do Spotify.', 400);
    }

    public static function falhaNaRenovacaoDeToken(): self
    {
        return new self('Ocorreu uma falha ao tentar renovar o token de acesso do Spotify.', 401);
    }

    public static function falhaServicoSpotify(): self
    {
        return new self('Os servidores do Spotify retornaram um erro temporário durante a solicitação.', 502);
    }

    public static function respostaInesperadaDoSpotify(): self
    {
        return new self('A resposta retornada pela API do Spotify possui um formato inválido ou inesperado.', 500);
    }

    public static function credenciaisNaoConfiguradas(): self
    {
        return new self('As credenciais da integração com o Spotify (Client ID ou Client Secret) não foram configuradas.', 500);
    }

    public static function stateInvalidoOuExpirado(): self
    {
        return new self('O parâmetro de validação (state) da autorização do Spotify é inválido ou expirou.', 400);
    }

    public static function autorizacaoNegada(): self
    {
        return new self('A autorização de acesso foi recusada no Spotify.', 400);
    }

    public static function contaJaVinculadaOutroUsuario(): self
    {
        return new self('Esta conta Spotify já está vinculada a outro usuário ou difere da conta originalmente conectada.', 409);
    }

    public static function contaNaoConectada(): self
    {
        return new self('Nenhuma conta do Spotify está conectada para este usuário.', 400);
    }

    public static function contaRequerReconexao(string $motivo): self
    {
        return new self(sprintf('A conta do Spotify requer reconexão manual pelo usuário. Motivo: %s', $motivo), 401);
    }

    public static function falhaAoObterLockRenovacao(): self
    {
        return new self('Não foi possível obter o bloqueio concorrente para renovação do token do Spotify.', 503);
    }

    public static function arquivoNaoEncontrado(string $caminho): self
    {
        return new self(sprintf('O arquivo de importação do Spotify não foi encontrado ou não pode ser lido: %s', $caminho), 404);
    }

    public static function arquivoSemHistoricoStreams(): self
    {
        return new self('Nenhum arquivo de histórico de reprodução (StreamingHistory ou endsong) foi encontrado no arquivo fornecido.', 400);
    }

    public static function formatoArquivoHistoricoInvalido(): self
    {
        return new self('O arquivo fornecido não é um arquivo ZIP nem um JSON de histórico válido do Spotify.', 400);
    }

    public static function falhaAoAbrirArquivoZip(string $motivo): self
    {
        return new self(sprintf('Não foi possível abrir o arquivo ZIP do Spotify: %s', $motivo), 400);
    }

    public static function importacaoNaoEncontrada(): self
    {
        return new self('A importação de histórico do Spotify solicitada não foi encontrada.', 404);
    }

    public static function importacaoJaEmAndamento(): self
    {
        return new self('Já existe uma importação de histórico em andamento para a sua conta. Aguarde o término antes de enviar outro arquivo.', 409);
    }

    public static function arquivoImportacaoNaoEnviado(): self
    {
        return new self('O arquivo de importação do Spotify não foi enviado.', 400);
    }

    public static function tamanhoArquivoExcedido(int $maxBytes): self
    {
        $maxMb = (int) round($maxBytes / (1024 * 1024));

        return new self(sprintf('O arquivo enviado ultrapassa o tamanho máximo permitido de %d MB.', $maxMb), 400);
    }

    public static function tipoArquivoNaoSuportado(): self
    {
        return new self('O arquivo enviado deve ser no formato ZIP ("Dados da conta") ou JSON de histórico do Spotify.', 400);
    }

    public static function falhaAoArmazenarArquivoImportacao(): self
    {
        return new self('Ocorreu uma falha ao salvar o arquivo de importação no armazenamento temporário.', 500);
    }

    public static function artistaSemReproducoes(string $artista): self
    {
        return new self(sprintf('Nenhuma reprodução de "%s" foi encontrada no seu histórico.', $artista), 404);
    }

    public static function musicaSemReproducoes(string $musica): self
    {
        return new self(sprintf('Nenhuma reprodução de "%s" foi encontrada no seu histórico.', $musica), 404);
    }
}
