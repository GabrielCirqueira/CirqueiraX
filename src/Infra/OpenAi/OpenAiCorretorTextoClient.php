<?php

declare(strict_types=1);

namespace App\Infra\OpenAi;

use App\Exception\Transcricao\TranscricaoException;
use App\Interface\CorretorTextoTranscricaoInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final readonly class OpenAiCorretorTextoClient implements CorretorTextoTranscricaoInterface
{
    private const string URL_CHAT = 'https://api.openai.com/v1/chat/completions';
    private const float TIMEOUT_SEGUNDOS = 300.0;
    private const string ESFORCO_RACIOCINIO = 'medium';
    private const int CODIGO_SUCESSO = 200;
    private const string INSTRUCOES = <<<'TEXTO'
        Você corrige textos gerados por transcrição automática (Whisper) de um áudio ou vídeo. O texto veio do reconhecimento de fala e tem falhas típicas desse processo.

        Corrija:
        - palavras trocadas por outras de som parecido, usando o contexto para achar a palavra certa;
        - nomes próprios, marcas e termos técnicos escritos errado;
        - pontuação, acentuação, maiúsculas e minúsculas;
        - frases cortadas ou emendadas no lugar errado;
        - palavras grudadas ou separadas e repetições acidentais do reconhecimento (por exemplo "que que que").

        Regras:
        - Mantenha tudo o que foi dito, na mesma ordem e com o mesmo sentido. Não resuma, não corte trechos, não acrescente informação e não comente.
        - Mantenha o idioma original e o jeito de falar de quem falou, inclusive gírias.
        - Organize em parágrafos curtos, quebrando onde muda o assunto.
        - Se um trecho for impossível de entender, deixe como está.
        - Responda somente com o texto corrigido, sem título, aspas ou explicação.
        TEXTO;

    public function __construct(
        private HttpClientInterface $httpClient,
        private string $chaveApi,
        private string $modelo,
    ) {}

    public function corrigirBloco(string $bloco, ?string $idioma, int $parte, int $totalPartes): string
    {
        if ('' === trim($this->chaveApi)) {
            throw TranscricaoException::correcaoIndisponivel();
        }

        try {
            $resposta = $this->httpClient->request('POST', self::URL_CHAT, [
                'auth_bearer' => $this->chaveApi,
                'timeout' => self::TIMEOUT_SEGUNDOS,
                'max_duration' => self::TIMEOUT_SEGUNDOS,
                'json' => [
                    'model' => $this->modelo,
                    'reasoning_effort' => self::ESFORCO_RACIOCINIO,
                    'messages' => [
                        ['role' => 'system', 'content' => self::INSTRUCOES],
                        ['role' => 'user', 'content' => $this->montarPedido($bloco, $idioma, $parte, $totalPartes)],
                    ],
                ],
            ]);

            $dados = $resposta->toArray(false);
            $codigo = $resposta->getStatusCode();
        } catch (ExceptionInterface $erro) {
            throw TranscricaoException::falhaNaCorrecao($erro->getMessage());
        }

        if (self::CODIGO_SUCESSO !== $codigo) {
            throw TranscricaoException::falhaNaCorrecao((string) ($dados['error']['message'] ?? sprintf('HTTP %d', $codigo)));
        }

        $texto = trim((string) ($dados['choices'][0]['message']['content'] ?? ''));
        if ('' === $texto) {
            throw TranscricaoException::falhaNaCorrecao('a resposta veio vazia');
        }

        return $texto;
    }

    private function montarPedido(string $bloco, ?string $idioma, int $parte, int $totalPartes): string
    {
        $contexto = $totalPartes > 1
            ? sprintf('Este é o trecho %d de %d da mesma transcrição; corrija só este trecho.', $parte, $totalPartes)
            : 'Esta é a transcrição completa.';
        $linhaIdioma = null === $idioma ? '' : sprintf(' Idioma detectado: %s.', $idioma);

        return sprintf("%s%s\n\nTexto transcrito:\n%s", $contexto, $linhaIdioma, $bloco);
    }
}
