<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\DataObject\Ia\EsquemaRespostaIaDTO;
use App\DataObject\Ia\PedidoIaDTO;
use App\DataObject\Pronuncia\CorrecaoPalavraPronunciaDTO;
use App\Domain\Pronuncia\ValidadorCorrecaoPronuncia;
use App\Entity\RelatoErroPronuncia;
use App\Entity\Usuario;
use App\Enum\FinalidadeConsumoIa;
use App\Exception\Ia\PoolIaException;
use App\Exception\Pronuncia\PronunciaException;
use App\Repository\RelatoErroPronunciaRepository;
use App\Service\Ia\CompletarComPoolIaService;
use App\Service\Ia\RegistrarConsumoIaService;

final readonly class SugerirCorrecaoPronunciaService
{
    private const int MAXIMO_TOKENS_SAIDA = 1500;
    private const int MAXIMO_PALAVRAS_SUGERIDAS = 30;

    public function __construct(
        private RelatoErroPronunciaRepository $relatoRepository,
        private CompletarComPoolIaService $completarComPool,
        private RegistrarConsumoIaService $registrarConsumo,
        private ValidadorCorrecaoPronuncia $validador,
    ) {
    }

    /**
     * Pede a uma IA do pool a correção da tradução e das palavras erradas. Nada é aplicado: a sugestão espera a aprovação de um administrador.
     *
     * @throws PronunciaException
     */
    public function executar(Usuario $usuario, string $uuidRelato): RelatoErroPronuncia
    {
        $relato = $this->relatoRepository->buscarPorUuid($uuidRelato) ?? throw PronunciaException::relatoNaoEncontrado();
        if (!$relato->isEmAberto()) {
            throw PronunciaException::relatoJaResolvido();
        }

        try {
            $resposta = $this->completarComPool->executar($this->montarPedido($relato));
        } catch (PoolIaException) {
            throw PronunciaException::semProvedorDeIa();
        }

        $this->registrarConsumo->executar($usuario, FinalidadeConsumoIa::CorrecaoPronuncia, $resposta);
        $json = $resposta->json ?? throw PronunciaException::respostaIaInvalida();

        $traducao = is_string($json[InstrucoesCorrecaoPronuncia::CAMPO_TRADUCAO] ?? null) ? trim($json[InstrucoesCorrecaoPronuncia::CAMPO_TRADUCAO]) : null;
        $explicacao = is_string($json[InstrucoesCorrecaoPronuncia::CAMPO_EXPLICACAO] ?? null) ? trim($json[InstrucoesCorrecaoPronuncia::CAMPO_EXPLICACAO]) : null;
        $relato->registrarSugestao(
            '' === $traducao ? null : $traducao,
            $this->palavrasValidas($json[InstrucoesCorrecaoPronuncia::CAMPO_PALAVRAS] ?? []),
            $explicacao,
        );
        $this->relatoRepository->salvar($relato);

        return $relato;
    }

    private function montarPedido(RelatoErroPronuncia $relato): PedidoIaDTO
    {
        $frase = $relato->frase();
        $palavras = [];
        foreach ($frase->analise()['sentencas'] ?? [] as $sentenca) {
            foreach (is_array($sentenca) ? ($sentenca['itens'] ?? []) : [] as $item) {
                if (is_array($item) && 'palavra' === ($item['tipo'] ?? null)) {
                    $palavras[] = ['palavra' => $item['chave'] ?? '', 'pronuncia' => $item['figurada'] ?? ''];
                }
            }
        }

        $conteudo = [
            'idiomaOriginal' => $frase->idiomaOrigem()->value,
            'portugues' => $frase->textoPortugues(),
            'ingles' => $frase->textoIngles(),
            'pronunciaAtual' => $frase->pronunciaResumida(),
            'palavras' => $palavras,
            'relato' => [
                'tipo' => $relato->tipo()->descricao(),
                'palavraApontada' => $relato->palavra(),
                'comentario' => $relato->comentario(),
            ],
        ];

        return new PedidoIaDTO(
            InstrucoesCorrecaoPronuncia::SISTEMA,
            (string) json_encode($conteudo, JSON_UNESCAPED_UNICODE),
            new EsquemaRespostaIaDTO(InstrucoesCorrecaoPronuncia::NOME_ESQUEMA, InstrucoesCorrecaoPronuncia::esquema()),
            self::MAXIMO_TOKENS_SAIDA,
        );
    }

    /**
     * @return list<array{palavra: string, pronuncia: string}>
     */
    private function palavrasValidas(mixed $itens): array
    {
        $validas = [];
        foreach (is_array($itens) ? array_slice($itens, 0, self::MAXIMO_PALAVRAS_SUGERIDAS) : [] as $item) {
            $correcao = $this->normalizarSugestao($item);
            if (null !== $correcao) {
                $validas[] = $correcao->paraArray();
            }
        }

        return $validas;
    }

    private function normalizarSugestao(mixed $item): ?CorrecaoPalavraPronunciaDTO
    {
        if (!is_array($item) || !is_string($item['palavra'] ?? null) || !is_string($item['pronuncia'] ?? null)) {
            return null;
        }

        try {
            return $this->validador->normalizar(new CorrecaoPalavraPronunciaDTO($item['palavra'], $item['pronuncia']));
        } catch (PronunciaException) {
            return null;
        }
    }
}
