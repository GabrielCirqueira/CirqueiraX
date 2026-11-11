<?php

declare(strict_types=1);

namespace App\Infra\OpenAi;

use App\DataObject\IdentificacaoMusica\ComponenteIdentificadoDTO;
use App\DataObject\IdentificacaoMusica\EntradaIdentificacaoDTO;
use App\DataObject\IdentificacaoMusica\ResultadoIdentificacaoDTO;
use App\DataObject\IdentificacaoMusica\ResultadoLoteIdentificacaoDTO;
use App\Enum\TipoIdentificacaoMusica;
use App\Enum\TipoVersaoMusica;
use App\Exception\IdentificacaoMusica\IdentificacaoException;
use App\Interface\IdentificadorMusicaInterface;
use JsonException;
use SensitiveParameter;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final readonly class OpenAiIdentificadorMusicaClient implements IdentificadorMusicaInterface
{
    private const string URL_CHAT = 'https://api.openai.com/v1/chat/completions';
    private const float TIMEOUT_SEGUNDOS = 30.0;
    private const int MAXIMO_TENTATIVAS = 2;
    private const int ESPERA_BASE_SEGUNDOS = 2;
    private const int ESPERA_MAXIMA_SEGUNDOS = 20;
    private const int CODIGO_SUCESSO = 200;
    private const int CODIGO_LIMITE = 429;
    private const int CODIGO_ERRO_SERVIDOR = 500;
    private const string NOME_ESQUEMA = 'identificacao_musicas';

    public function __construct(
        private HttpClientInterface $httpClient,
        private ValidatorInterface $validator,
        #[SensitiveParameter]
        private string $chaveApi,
        private string $modelo,
        private string $esforcoRaciocinio,
    ) {
    }

    public function identificar(array $entradas): ResultadoLoteIdentificacaoDTO
    {
        if ('' === trim($this->chaveApi)) {
            throw IdentificacaoException::chaveAusente();
        }

        $dados = $this->enviarComTentativas($entradas);
        $tokensEntrada = (int) ($dados['usage']['prompt_tokens'] ?? 0);
        $tokensSaida = (int) ($dados['usage']['completion_tokens'] ?? 0);
        $modelo = is_string($dados['model'] ?? null) ? $dados['model'] : $this->modelo;
        $invalida = IdentificacaoException::respostaInvalida($modelo, $tokensEntrada, $tokensSaida);

        $conteudo = $dados['choices'][0]['message']['content'] ?? null;
        if (!is_string($conteudo)) {
            throw $invalida;
        }

        try {
            $json = json_decode($conteudo, true, 32, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw $invalida;
        }

        if (!is_array($json) || !is_array($json['resultados'] ?? null)) {
            throw $invalida;
        }

        $idsEsperados = array_flip(array_map(static fn (EntradaIdentificacaoDTO $entrada): string => $entrada->id, $entradas));
        $resultados = [];
        $idsInvalidos = [];
        foreach ($json['resultados'] as $item) {
            $id = is_array($item) && is_string($item['id'] ?? null) ? $item['id'] : null;
            if (null === $id || !isset($idsEsperados[$id])) {
                continue;
            }

            $resultado = $this->mapearResultadoValido($item);
            if (null === $resultado) {
                $idsInvalidos[] = $id;

                continue;
            }
            $resultados[$id] = $resultado;
        }

        return new ResultadoLoteIdentificacaoDTO($resultados, $modelo, $tokensEntrada, $tokensSaida, array_values(array_unique($idsInvalidos)));
    }

    /**
     * @param list<EntradaIdentificacaoDTO> $entradas
     *
     * @return array<string, mixed>
     */
    private function enviarComTentativas(array $entradas): array
    {
        $tentativa = 1;

        while (true) {
            $resposta = $this->enviar($entradas);
            if (self::CODIGO_SUCESSO === $resposta['codigo']) {
                return $resposta['dados'];
            }

            $repetivel = self::CODIGO_LIMITE === $resposta['codigo'] || $resposta['codigo'] >= self::CODIGO_ERRO_SERVIDOR;
            if (!$repetivel) {
                throw IdentificacaoException::pedidoRecusado($resposta['codigo']);
            }

            if ($tentativa >= self::MAXIMO_TENTATIVAS) {
                throw self::CODIGO_LIMITE === $resposta['codigo'] ? IdentificacaoException::limiteDeRequisicoes() : IdentificacaoException::servicoIndisponivel();
            }

            sleep(min(self::ESPERA_MAXIMA_SEGUNDOS, $resposta['esperaSegundos'] ?? self::ESPERA_BASE_SEGUNDOS * $tentativa));
            ++$tentativa;
        }
    }

    /**
     * @param list<EntradaIdentificacaoDTO> $entradas
     *
     * @return array{codigo: int, dados: array<string, mixed>, esperaSegundos: int|null}
     */
    private function enviar(array $entradas): array
    {
        try {
            $resposta = $this->httpClient->request('POST', self::URL_CHAT, [
                'auth_bearer' => $this->chaveApi,
                'timeout' => self::TIMEOUT_SEGUNDOS,
                'max_duration' => self::TIMEOUT_SEGUNDOS,
                'json' => [
                    'model' => $this->modelo,
                    'reasoning_effort' => $this->esforcoRaciocinio,
                    'messages' => [
                        ['role' => 'system', 'content' => InstrucoesIdentificacaoMusica::SISTEMA],
                        ['role' => 'user', 'content' => json_encode(['itens' => array_map(static fn (EntradaIdentificacaoDTO $entrada): array => $entrada->paraPedido(), $entradas)], JSON_UNESCAPED_UNICODE)],
                    ],
                    'response_format' => ['type' => 'json_schema', 'json_schema' => ['name' => self::NOME_ESQUEMA, 'strict' => true, 'schema' => $this->esquema()]],
                ],
            ]);
            $codigo = $resposta->getStatusCode();
            $retryAfter = $resposta->getHeaders(false)['retry-after'][0] ?? null;

            return [
                'codigo' => $codigo,
                'dados' => self::CODIGO_SUCESSO === $codigo ? $resposta->toArray(false) : [],
                'esperaSegundos' => is_numeric($retryAfter) ? (int) $retryAfter : null,
            ];
        } catch (ExceptionInterface) {
            return ['codigo' => self::CODIGO_ERRO_SERVIDOR, 'dados' => [], 'esperaSegundos' => null];
        }
    }

    /**
     * @param array<mixed> $item
     */
    private function mapearResultadoValido(array $item): ?ResultadoIdentificacaoDTO
    {
        try {
            $resultado = $this->mapearResultado($item);
        } catch (IdentificacaoException) {
            return null;
        }

        return count($this->validator->validate($resultado)) > 0 ? null : $resultado;
    }

    /**
     * @param array<mixed> $item
     */
    private function mapearResultado(array $item): ResultadoIdentificacaoDTO
    {
        $tipo = TipoIdentificacaoMusica::tryFrom((string) ($item['tipo'] ?? ''));
        $versao = TipoVersaoMusica::tryFrom((string) ($item['versao'] ?? ''));
        if (!is_string($item['id'] ?? null) || null === $tipo || null === $versao || !is_int($item['confianca'] ?? null)) {
            throw IdentificacaoException::respostaInvalida($this->modelo, 0, 0);
        }

        return new ResultadoIdentificacaoDTO(
            $item['id'],
            $tipo,
            $item['confianca'],
            $versao,
            $this->mapearComponentes($item['componentes'] ?? null),
            true === ($item['ambiguo'] ?? false),
            array_slice($this->mapearComponentes($item['alternativas'] ?? null), 0, ResultadoIdentificacaoDTO::LIMITE_ALTERNATIVAS),
        );
    }

    /**
     * @return list<ComponenteIdentificadoDTO>
     */
    private function mapearComponentes(mixed $lista): array
    {
        if (!is_array($lista)) {
            throw IdentificacaoException::respostaInvalida($this->modelo, 0, 0);
        }

        $componentes = [];
        foreach ($lista as $componente) {
            if (!is_array($componente) || !is_string($componente['titulo'] ?? null) || !is_array($componente['artistas'] ?? null)) {
                throw IdentificacaoException::respostaInvalida($this->modelo, 0, 0);
            }
            $artistas = array_values(array_filter(array_map(static fn (mixed $nome): string => is_string($nome) ? trim($nome) : '', $componente['artistas']), static fn (string $nome): bool => '' !== $nome));
            $componentes[] = new ComponenteIdentificadoDTO(trim($componente['titulo']), $artistas);
        }

        return $componentes;
    }

    /**
     * @return array<string, mixed>
     */
    private function esquema(): array
    {
        $componente = [
            'type' => 'object',
            'additionalProperties' => false,
            'required' => ['titulo', 'artistas'],
            'properties' => [
                'titulo' => ['type' => 'string'],
                'artistas' => ['type' => 'array', 'items' => ['type' => 'string']],
            ],
        ];

        return [
            'type' => 'object',
            'additionalProperties' => false,
            'required' => ['resultados'],
            'properties' => [
                'resultados' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'additionalProperties' => false,
                        'required' => ['id', 'tipo', 'confianca', 'versao', 'componentes', 'ambiguo', 'alternativas'],
                        'properties' => [
                            'id' => ['type' => 'string'],
                            'tipo' => ['type' => 'string', 'enum' => array_column(TipoIdentificacaoMusica::cases(), 'value')],
                            'confianca' => ['type' => 'integer'],
                            'versao' => ['type' => 'string', 'enum' => array_column(TipoVersaoMusica::cases(), 'value')],
                            'componentes' => ['type' => 'array', 'items' => $componente],
                            'ambiguo' => ['type' => 'boolean'],
                            'alternativas' => ['type' => 'array', 'items' => $componente],
                        ],
                    ],
                ],
            ],
        ];
    }
}
