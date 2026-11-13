<?php

declare(strict_types=1);

namespace App\Service\IdentificacaoMusica\Ia;

use App\DataObject\Ia\EsquemaRespostaIaDTO;
use App\DataObject\Ia\PedidoIaDTO;
use App\DataObject\IdentificacaoMusica\ComponenteIdentificadoDTO;
use App\DataObject\IdentificacaoMusica\EntradaIdentificacaoDTO;
use App\DataObject\IdentificacaoMusica\ResultadoIdentificacaoDTO;
use App\DataObject\IdentificacaoMusica\ResultadoLoteIdentificacaoDTO;
use App\Enum\TipoIdentificacaoMusica;
use App\Enum\TipoVersaoMusica;
use App\Exception\Ia\PoolIaException;
use App\Exception\IdentificacaoMusica\IdentificacaoException;
use App\Interface\IdentificadorMusicaInterface;
use App\Service\Ia\CompletarComPoolIaService;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final readonly class IdentificarMusicasComIaService implements IdentificadorMusicaInterface
{
    private const string PREFIXO_APELIDO = 'v';
    private const int MAXIMO_TOKENS_SAIDA = 8000;

    public function __construct(
        private CompletarComPoolIaService $completarComPool,
        private ValidatorInterface $validator,
    ) {
    }

    public function identificar(array $entradas): ResultadoLoteIdentificacaoDTO
    {
        $idsPorApelido = [];
        foreach ($entradas as $indice => $entrada) {
            $idsPorApelido[self::PREFIXO_APELIDO.($indice + 1)] = $entrada->id;
        }

        try {
            $resposta = $this->completarComPool->executar($this->montarPedido($entradas, array_flip($idsPorApelido)));
        } catch (PoolIaException) {
            throw IdentificacaoException::semProvedorDisponivel();
        }

        $itens = $resposta->json[InstrucoesIdentificacaoMusica::CAMPO_RESULTADOS] ?? null;
        if (!is_array($itens)) {
            throw IdentificacaoException::respostaInvalida($resposta);
        }

        $resultados = [];
        $idsInvalidos = [];
        foreach ($itens as $item) {
            $apelido = is_array($item) && is_string($item['id'] ?? null) ? $item['id'] : null;
            $id = null === $apelido ? null : ($idsPorApelido[$apelido] ?? null);
            if (null === $id || isset($resultados[$id])) {
                continue;
            }

            $resultado = $this->mapearResultadoValido([...$item, 'id' => $id]);
            if (null === $resultado) {
                $idsInvalidos[] = $id;

                continue;
            }
            $resultados[$id] = $resultado;
        }

        return new ResultadoLoteIdentificacaoDTO($resultados, $resposta, array_values(array_unique($idsInvalidos)));
    }

    /**
     * @param list<EntradaIdentificacaoDTO> $entradas
     * @param array<string, string>         $apelidosPorId
     */
    private function montarPedido(array $entradas, array $apelidosPorId): PedidoIaDTO
    {
        $itens = array_map(
            static fn (EntradaIdentificacaoDTO $entrada): array => [...$entrada->paraPedido(), 'id' => $apelidosPorId[$entrada->id]],
            $entradas,
        );

        return new PedidoIaDTO(
            InstrucoesIdentificacaoMusica::SISTEMA,
            (string) json_encode(['itens' => $itens], JSON_UNESCAPED_UNICODE),
            new EsquemaRespostaIaDTO(InstrucoesIdentificacaoMusica::NOME_ESQUEMA, InstrucoesIdentificacaoMusica::esquema()),
            self::MAXIMO_TOKENS_SAIDA,
        );
    }

    /**
     * @param array<mixed> $item
     */
    private function mapearResultadoValido(array $item): ?ResultadoIdentificacaoDTO
    {
        $resultado = $this->mapearResultado($item);
        if (null === $resultado) {
            return null;
        }

        return count($this->validator->validate($resultado)) > 0 ? null : $resultado;
    }

    /**
     * @param array<mixed> $item
     */
    private function mapearResultado(array $item): ?ResultadoIdentificacaoDTO
    {
        $tipo = TipoIdentificacaoMusica::tryFrom((string) ($item['tipo'] ?? ''));
        $versao = TipoVersaoMusica::tryFrom((string) ($item['versao'] ?? ''));
        $componentes = $this->mapearComponentes($item['componentes'] ?? null);
        $alternativas = $this->mapearComponentes($item['alternativas'] ?? []);
        if (!is_string($item['id'] ?? null) || null === $tipo || null === $versao || !is_int($item['confianca'] ?? null) || null === $componentes || null === $alternativas) {
            return null;
        }

        return new ResultadoIdentificacaoDTO(
            $item['id'],
            $tipo,
            $item['confianca'],
            $versao,
            $componentes,
            true === ($item['ambiguo'] ?? false),
            array_slice($alternativas, 0, ResultadoIdentificacaoDTO::LIMITE_ALTERNATIVAS),
        );
    }

    /**
     * @return list<ComponenteIdentificadoDTO>|null
     */
    private function mapearComponentes(mixed $lista): ?array
    {
        if (!is_array($lista)) {
            return null;
        }

        $componentes = [];
        foreach ($lista as $componente) {
            if (!is_array($componente) || !is_string($componente['titulo'] ?? null) || !is_array($componente['artistas'] ?? null)) {
                return null;
            }
            $artistas = array_values(array_filter(array_map(static fn (mixed $nome): string => is_string($nome) ? trim($nome) : '', $componente['artistas']), static fn (string $nome): bool => '' !== $nome));
            $componentes[] = new ComponenteIdentificadoDTO(trim($componente['titulo']), $artistas);
        }

        return $componentes;
    }
}
