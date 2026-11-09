<?php

declare(strict_types=1);

namespace App\Exception\Transcricao;

use DomainException;

final class TranscricaoException extends DomainException
{
    private const int TAMANHO_MAXIMO_DETALHE = 400;

    public static function transcricaoNaoEncontrada(): self
    {
        return new self('A transcrição não foi encontrada.', 404);
    }

    public static function arquivoNaoEnviado(): self
    {
        return new self('Envie um arquivo de áudio ou vídeo para transcrever.', 422);
    }

    public static function arquivoInvalido(string $motivo): self
    {
        return new self(sprintf('O arquivo enviado é inválido: %s', $motivo), 422);
    }

    public static function falhaAoSalvarAudio(): self
    {
        return new self('Não foi possível salvar o áudio enviado no servidor.', 500);
    }

    public static function falhaAoRemoverAudio(string $caminho): self
    {
        return new self(sprintf('Não foi possível apagar o arquivo de áudio "%s".', basename($caminho)), 500);
    }

    public static function falhaAoExtrairAudioDoVideo(string $detalhe): self
    {
        return new self(sprintf('Não foi possível tirar o áudio do vídeo. Confira se o vídeo tem som. Detalhe: %s', self::resumirDetalhe($detalhe)), 422);
    }

    public static function naoPodeCorrigir(): self
    {
        return new self('Só dá para corrigir com IA uma transcrição pronta, com texto e sem outra correção em andamento.', 409);
    }

    public static function correcaoIndisponivel(): self
    {
        return new self('A correção com IA não está configurada no servidor.', 503);
    }

    public static function falhaNaCorrecao(string $detalhe): self
    {
        return new self(sprintf('A IA não conseguiu corrigir o texto. Detalhe: %s', self::resumirDetalhe($detalhe)), 502);
    }

    public static function audioIndisponivel(): self
    {
        return new self('O áudio desta transcrição já foi apagado. Ele fica guardado por 7 dias após o envio.', 410);
    }

    public static function naoPodeReprocessar(): self
    {
        return new self('Só é possível transcrever de novo quando a transcrição terminou e o áudio ainda está guardado.', 409);
    }

    public static function naoPodeApagarDuranteTranscricao(): self
    {
        return new self('Espere a transcrição terminar para apagar este áudio.', 409);
    }

    public static function falhaAoConverterAudio(string $detalhe): self
    {
        return new self(sprintf(
            'Não foi possível ler o áudio. Verifique se o arquivo não está corrompido. Detalhe: %s',
            self::resumirDetalhe($detalhe),
        ), 422);
    }

    public static function falhaAoTranscrever(string $detalhe): self
    {
        return new self(sprintf('O motor de transcrição falhou. Detalhe: %s', self::resumirDetalhe($detalhe)), 500);
    }

    public static function modeloIndisponivel(): self
    {
        return new self('O modelo de transcrição não está instalado no servidor.', 503);
    }

    public static function nenhumaFalaEncontrada(): self
    {
        return new self('Nenhuma fala foi reconhecida neste áudio.', 422);
    }

    public static function transcricaoInterrompida(): self
    {
        return new self('A transcrição foi interrompida antes de terminar. Tente transcrever de novo.', 500);
    }

    private static function resumirDetalhe(string $detalhe): string
    {
        $linhas = array_values(array_filter(array_map('trim', explode("\n", $detalhe))));
        $ultimaLinha = [] === $linhas ? 'sem detalhes' : $linhas[count($linhas) - 1];

        return mb_substr($ultimaLinha, 0, self::TAMANHO_MAXIMO_DETALHE);
    }
}
