<?php

declare(strict_types=1);

namespace App\Infra\Ia;

use App\DataObject\Ia\EsquemaRespostaIaDTO;
use App\DataObject\Ia\PedidoIaDTO;
use App\DataObject\Ia\RespostaIaDTO;
use App\Enum\ProvedorIa;
use App\Exception\Ia\ProvedorIaException;
use App\Interface\ProvedorIaInterface;
use App\Support\TextoUtil;
use SensitiveParameter;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final readonly class ProvedorIaCompativelOpenAiClient implements ProvedorIaInterface
{
    private const string CAMINHO_CONVERSA = '/chat/completions';
    private const string CAMPO_LIMITE_TOKENS_PADRAO = 'max_tokens';
    private const string CABECALHO_ESPERA = 'retry-after';
    private const string PAPEL_SISTEMA = 'system';
    private const string PAPEL_USUARIO = 'user';
    private const string FORMATO_ESQUEMA = 'json_schema';
    private const string FORMATO_OBJETO_JSON = 'json_object';
    private const string INSTRUCAO_FORMATO_JSON = "\n\nResponda somente com um objeto JSON válido, sem nenhum texto fora dele, seguindo exatamente este esquema JSON:\n%s";
    private const int CODIGO_SUCESSO = 200;
    private const int CODIGO_PEDIDO_INVALIDO = 400;
    private const int CODIGO_LIMITE = 429;
    private const array CODIGOS_ACESSO_NEGADO = [401, 402, 403, 404, 410];
    private const int TOKENS_POR_MILHAO = 1000000;
    private const int MICRODOLARES_POR_DOLAR = 1000000;

    /**
     * @param array<string, mixed> $parametrosAdicionais
     */
    public function __construct(
        private HttpClientInterface $httpClient,
        private ProvedorIa $provedor,
        private string $urlBase,
        #[SensitiveParameter]
        private string $chaveApi,
        private string $modelo,
        private bool $aceitaEsquemaEstrito,
        private float $timeoutSegundos,
        private float $precoEntradaPorMilhao = 0.0,
        private float $precoSaidaPorMilhao = 0.0,
        private array $parametrosAdicionais = [],
        private string $campoLimiteTokens = self::CAMPO_LIMITE_TOKENS_PADRAO,
    ) {
    }

    public function provedor(): ProvedorIa
    {
        return $this->provedor;
    }

    public function modelo(): string
    {
        return $this->modelo;
    }

    public function isConfigurado(): bool
    {
        return TextoUtil::naoEstaEmBranco($this->chaveApi) && TextoUtil::naoEstaEmBranco($this->modelo);
    }

    public function isGratuito(): bool
    {
        return 0.0 === $this->precoEntradaPorMilhao && 0.0 === $this->precoSaidaPorMilhao;
    }

    public function calcularCustoMicrodolares(int $tokensEntrada, int $tokensSaida): int
    {
        $dolares = ($tokensEntrada * $this->precoEntradaPorMilhao + $tokensSaida * $this->precoSaidaPorMilhao) / self::TOKENS_POR_MILHAO;

        return (int) round($dolares * self::MICRODOLARES_POR_DOLAR);
    }

    public function completar(PedidoIaDTO $pedido): RespostaIaDTO
    {
        $dados = $this->enviar($this->montarCorpo($pedido));
        $texto = $dados['choices'][0]['message']['content'] ?? null;

        if (!is_string($texto) || TextoUtil::estaEmBranco($texto)) {
            throw ProvedorIaException::respostaVazia($this->provedor);
        }

        $tokensEntrada = (int) ($dados['usage']['prompt_tokens'] ?? 0);
        $tokensSaida = (int) ($dados['usage']['completion_tokens'] ?? 0);
        $modelo = is_string($dados['model'] ?? null) ? $dados['model'] : $this->modelo;

        return new RespostaIaDTO($this->provedor, $modelo, $texto, $tokensEntrada, $tokensSaida, $this->calcularCustoMicrodolares($tokensEntrada, $tokensSaida));
    }

    /**
     * @return array<string, mixed>
     */
    private function montarCorpo(PedidoIaDTO $pedido): array
    {
        $corpo = [
            ...$this->parametrosAdicionais,
            'model' => $this->modelo,
            $this->campoLimiteTokens => $pedido->maximoTokensSaida,
            'messages' => [
                ['role' => self::PAPEL_SISTEMA, 'content' => $pedido->instrucoes.$this->instrucaoDeFormato($pedido->esquemaResposta)],
                ['role' => self::PAPEL_USUARIO, 'content' => $pedido->conteudo],
            ],
        ];

        if (null === $pedido->esquemaResposta) {
            return $corpo;
        }

        return [...$corpo, 'response_format' => $this->formatoResposta($pedido->esquemaResposta)];
    }

    private function instrucaoDeFormato(?EsquemaRespostaIaDTO $esquema): string
    {
        if (null === $esquema || $this->aceitaEsquemaEstrito) {
            return '';
        }

        return sprintf(self::INSTRUCAO_FORMATO_JSON, json_encode($esquema->esquema, JSON_UNESCAPED_UNICODE));
    }

    /**
     * @return array<string, mixed>
     */
    private function formatoResposta(EsquemaRespostaIaDTO $esquema): array
    {
        if (!$this->aceitaEsquemaEstrito) {
            return ['type' => self::FORMATO_OBJETO_JSON];
        }

        return ['type' => self::FORMATO_ESQUEMA, 'json_schema' => ['name' => $esquema->nome, 'strict' => true, 'schema' => $esquema->esquema]];
    }

    /**
     * @param array<string, mixed> $corpo
     *
     * @return array<string, mixed>
     */
    private function enviar(array $corpo): array
    {
        try {
            $resposta = $this->httpClient->request('POST', rtrim($this->urlBase, '/').self::CAMINHO_CONVERSA, [
                'auth_bearer' => $this->chaveApi,
                'timeout' => $this->timeoutSegundos,
                'max_duration' => $this->timeoutSegundos,
                'json' => $corpo,
            ]);
            $codigo = $resposta->getStatusCode();
            $this->verificarCodigo($codigo, $resposta->getHeaders(false)[self::CABECALHO_ESPERA][0] ?? null);

            return $resposta->toArray(false);
        } catch (ExceptionInterface) {
            throw ProvedorIaException::indisponivel($this->provedor);
        }
    }

    private function verificarCodigo(int $codigo, ?string $espera): void
    {
        if (self::CODIGO_SUCESSO === $codigo) {
            return;
        }

        if (self::CODIGO_LIMITE === $codigo) {
            throw ProvedorIaException::limiteAtingido($this->provedor, is_numeric($espera) ? (int) ceil((float) $espera) : null);
        }

        if (in_array($codigo, self::CODIGOS_ACESSO_NEGADO, true)) {
            throw ProvedorIaException::acessoNegado($this->provedor, $codigo);
        }

        if (self::CODIGO_PEDIDO_INVALIDO === $codigo) {
            throw ProvedorIaException::pedidoRecusado($this->provedor, $codigo);
        }

        throw ProvedorIaException::indisponivel($this->provedor);
    }
}
