<?php

declare(strict_types=1);

namespace App\Feature\Pronuncia;

use App\DataObject\Pronuncia\AnalisePronunciaDTO;
use App\DataObject\Pronuncia\ContextoPronunciaDTO;
use App\DataObject\Pronuncia\FonemasResolvidosDTO;
use App\DataObject\Pronuncia\PalavraPronunciadaDTO;
use App\DataObject\Pronuncia\TokenTextoDTO;
use App\Domain\Pronuncia\ConversorFonemasPortugues;
use App\Domain\Pronuncia\GeradorDicasPronuncia;
use App\Domain\Pronuncia\MontadorSentencaPronunciada;
use App\Domain\Pronuncia\PalavrasFuncionaisIngles;
use App\Enum\OrigemPronunciaPalavra;
use App\Interface\ResolvedorPronunciaPalavraInterface;
use Symfony\Component\DependencyInjection\Attribute\AutowireIterator;

final readonly class PronunciarTextoFeature
{
    private const string SEPARADOR_SILABAS = '-';

    /**
     * @param iterable<ResolvedorPronunciaPalavraInterface> $resolvedores
     */
    public function __construct(
        #[AutowireIterator(ResolvedorPronunciaPalavraInterface::TAG)]
        private iterable $resolvedores,
        private ConversorFonemasPortugues $conversor,
        private GeradorDicasPronuncia $geradorDicas,
        private PalavrasFuncionaisIngles $palavrasFuncionais,
        private MontadorSentencaPronunciada $montador,
    ) {
    }

    /**
     * Cada palavra passa pela cascata de resolvedores (exceção revisada → homógrafo → dicionário → palavra derivada → regras de letra e som) até um responder.
     *
     * @param list<array{texto: string, tokens: list<TokenTextoDTO>}> $sentencas
     */
    public function executar(array $sentencas, ContextoPronunciaDTO $contexto): AnalisePronunciaDTO
    {
        $resultado = [];
        foreach ($sentencas as $sentenca) {
            $resultado[] = $this->montador->montar($sentenca['texto'], $this->pronunciarTokens($sentenca['tokens'], $contexto));
        }

        return new AnalisePronunciaDTO($resultado);
    }

    /**
     * @param list<TokenTextoDTO> $tokens
     *
     * @return list<PalavraPronunciadaDTO|TokenTextoDTO>
     */
    private function pronunciarTokens(array $tokens, ContextoPronunciaDTO $contexto): array
    {
        $itens = [];
        $anterior = null;
        foreach ($tokens as $token) {
            if (!$token->isPalavra()) {
                $itens[] = $token;

                continue;
            }

            $itens[] = $this->pronunciarPalavra($token, $anterior, $contexto);
            $anterior = $token->chave();
        }

        return $itens;
    }

    private function pronunciarPalavra(TokenTextoDTO $token, ?string $anterior, ContextoPronunciaDTO $contexto): PalavraPronunciadaDTO
    {
        $chave = $token->chave();
        $funcional = $this->palavrasFuncionais->isFuncional($chave);
        $resolvido = $this->resolver($chave, $anterior, $contexto);

        if ($resolvido->isFigurada()) {
            return $this->deFigurada($token, $resolvido, $funcional);
        }

        $conversao = $this->conversor->converter($resolvido->fonemas, $funcional);

        return new PalavraPronunciadaDTO(
            $token->texto,
            $chave,
            $conversao['silabas'],
            $conversao['tonica'],
            $resolvido->fonemas,
            $resolvido->origem,
            $this->geradorDicas->gerar($resolvido->fonemas, $conversao['flap']),
            $funcional,
        );
    }

    private function resolver(string $chave, ?string $anterior, ContextoPronunciaDTO $contexto): FonemasResolvidosDTO
    {
        foreach ($this->resolvedores as $resolvedor) {
            $resolvido = $resolvedor->resolver($chave, $anterior, $contexto);
            if (null !== $resolvido) {
                return $resolvido;
            }
        }

        return new FonemasResolvidosDTO(OrigemPronunciaPalavra::Aproximada, [], $chave);
    }

    private function deFigurada(TokenTextoDTO $token, FonemasResolvidosDTO $resolvido, bool $funcional): PalavraPronunciadaDTO
    {
        $silabas = explode(self::SEPARADOR_SILABAS, (string) $resolvido->pronunciaFigurada);
        $tonica = null;
        foreach ($silabas as $indice => $silaba) {
            if (null === $tonica && mb_strtolower($silaba) !== $silaba) {
                $tonica = $indice;
            }
        }

        return new PalavraPronunciadaDTO(
            $token->texto,
            $token->chave(),
            $silabas,
            $tonica,
            $resolvido->fonemas,
            $resolvido->origem,
            $this->geradorDicas->gerar($resolvido->fonemas, false),
            $funcional,
        );
    }
}
