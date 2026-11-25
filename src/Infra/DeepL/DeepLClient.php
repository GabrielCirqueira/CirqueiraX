<?php

declare(strict_types=1);

namespace App\Infra\DeepL;

use App\DataObject\Pronuncia\TraducaoDTO;
use App\DataObject\Pronuncia\UsoTraducaoDTO;
use App\Enum\IdiomaFrase;
use App\Exception\Pronuncia\TraducaoException;
use App\Interface\TradutorTextoInterface;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\BadResponseException;
use GuzzleHttp\Exception\GuzzleException;

final readonly class DeepLClient implements TradutorTextoInterface
{
    private const string URL_PLANO_GRATIS = 'https://api-free.deepl.com/v2/';
    private const string URL_PLANO_PAGO = 'https://api.deepl.com/v2/';
    private const string SUFIXO_CHAVE_GRATIS = ':fx';
    private const string CAMINHO_TRADUCAO = 'translate';
    private const string CAMINHO_USO = 'usage';
    private const string CABECALHO_AUTORIZACAO = 'Authorization';
    private const string PREFIXO_AUTORIZACAO = 'DeepL-Auth-Key ';
    private const int TIMEOUT_SEGUNDOS = 15;
    private const int CODIGO_CHAVE_RECUSADA = 403;
    private const int CODIGO_NAO_AUTORIZADO = 401;
    private const int CODIGO_MUITAS_REQUISICOES = 429;
    private const int CODIGO_COTA_ESGOTADA = 456;
    private const bool PRESERVAR_FORMATACAO = true;
    private const int TEXTOS_POR_REQUISICAO = 50;

    public function __construct(
        private ClientInterface $client,
        #[\SensitiveParameter]
        private string $chaveApi,
    ) {
    }

    public function traduzir(string $texto, IdiomaFrase $destino, ?IdiomaFrase $origem = null): TraducaoDTO
    {
        $corpo = ['text' => [$texto], 'target_lang' => $destino->codigoDestinoDeepL(), 'preserve_formatting' => self::PRESERVAR_FORMATACAO];
        if (null !== $origem) {
            $corpo['source_lang'] = strtoupper($origem->value);
        }

        $dados = $this->requisitar('POST', self::CAMINHO_TRADUCAO, ['json' => $corpo]);
        $traducao = is_array($dados['translations'] ?? null) ? ($dados['translations'][0] ?? null) : null;
        if (!is_array($traducao) || !is_string($traducao['text'] ?? null)) {
            throw TraducaoException::respostaInesperada();
        }

        $detectado = is_string($traducao['detected_source_language'] ?? null) ? IdiomaFrase::doCodigoDeepL($traducao['detected_source_language']) : null;

        return new TraducaoDTO(trim($traducao['text']), $detectado);
    }

    public function traduzirLote(array $textos, IdiomaFrase $destino, ?IdiomaFrase $origem = null): array
    {
        $traducoes = [];
        foreach (array_chunk($textos, self::TEXTOS_POR_REQUISICAO) as $lote) {
            $corpo = ['text' => $lote, 'target_lang' => $destino->codigoDestinoDeepL(), 'preserve_formatting' => self::PRESERVAR_FORMATACAO];
            if (null !== $origem) {
                $corpo['source_lang'] = strtoupper($origem->value);
            }

            $itens = $this->requisitar('POST', self::CAMINHO_TRADUCAO, ['json' => $corpo])['translations'] ?? null;
            if (!is_array($itens) || count($itens) !== count($lote)) {
                throw TraducaoException::respostaInesperada();
            }

            foreach ($itens as $item) {
                $traducoes[] = is_array($item) && is_string($item['text'] ?? null) ? trim($item['text']) : '';
            }
        }

        return $traducoes;
    }

    public function consultarUso(): UsoTraducaoDTO
    {
        if ('' === trim($this->chaveApi)) {
            return UsoTraducaoDTO::naoConfigurado();
        }

        $dados = $this->requisitar('GET', self::CAMINHO_USO, []);

        return new UsoTraducaoDTO(
            is_int($dados['character_count'] ?? null) ? $dados['character_count'] : 0,
            is_int($dados['character_limit'] ?? null) ? $dados['character_limit'] : 0,
            true,
        );
    }

    /**
     * @param array<string, mixed> $opcoes
     *
     * @return array<string, mixed>
     */
    private function requisitar(string $metodo, string $caminho, array $opcoes): array
    {
        if ('' === trim($this->chaveApi)) {
            throw TraducaoException::chaveAusente();
        }

        try {
            $resposta = $this->client->request($metodo, $this->urlBase().$caminho, [
                ...$opcoes,
                'headers' => [self::CABECALHO_AUTORIZACAO => self::PREFIXO_AUTORIZACAO.$this->chaveApi],
                'timeout' => self::TIMEOUT_SEGUNDOS,
            ]);
        } catch (BadResponseException $erro) {
            throw $this->classificarErro($erro->getResponse()->getStatusCode());
        } catch (GuzzleException) {
            throw TraducaoException::servicoIndisponivel();
        }

        try {
            $dados = json_decode((string) $resposta->getBody(), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw TraducaoException::respostaInesperada();
        }

        if (!is_array($dados)) {
            throw TraducaoException::respostaInesperada();
        }

        /* @var array<string, mixed> $dados */
        return $dados;
    }

    private function urlBase(): string
    {
        return str_ends_with(trim($this->chaveApi), self::SUFIXO_CHAVE_GRATIS) ? self::URL_PLANO_GRATIS : self::URL_PLANO_PAGO;
    }

    private function classificarErro(int $status): TraducaoException
    {
        return match ($status) {
            self::CODIGO_CHAVE_RECUSADA, self::CODIGO_NAO_AUTORIZADO => TraducaoException::chaveRecusada(),
            self::CODIGO_MUITAS_REQUISICOES => TraducaoException::muitasRequisicoes(),
            self::CODIGO_COTA_ESGOTADA => TraducaoException::cotaEsgotada(),
            default => TraducaoException::servicoIndisponivel(),
        };
    }
}
