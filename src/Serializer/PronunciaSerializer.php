<?php

declare(strict_types=1);

namespace App\Serializer;

use App\DataObject\Pronuncia\AnalisePronunciaDTO;
use App\DataObject\Pronuncia\LetraMusicaPronunciadaDTO;
use App\DataObject\Pronuncia\PalavraPronunciadaDTO;
use App\Entity\ConsultaPronuncia;
use App\Entity\ExcecaoPronuncia;
use App\Entity\FrasePronuncia;
use App\Entity\RelatoErroPronuncia;

final readonly class PronunciaSerializer
{
    private const int CEM = 100;

    /**
     * @param list<ConsultaPronuncia> $consultas
     *
     * @return list<array<string, mixed>>
     */
    public function serializarHistorico(array $consultas): array
    {
        return array_map(fn (ConsultaPronuncia $consulta): array => $this->serializarResumoConsulta($consulta), $consultas);
    }

    /**
     * @return array<string, mixed>
     */
    public function serializarConsulta(ConsultaPronuncia $consulta): array
    {
        return [
            ...$this->serializarResumoConsulta($consulta),
            'analise' => $consulta->frase()->analise(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    /**
     * @return array<string, mixed>
     */
    public function serializarLetra(LetraMusicaPronunciadaDTO $dto): array
    {
        $letra = $dto->letra;
        $traducoes = $letra->traducoes() ?? [];
        $linhas = [];
        foreach ($letra->linhas() as $indice => $linha) {
            $analise = $dto->analises[$indice] ?? null;
            $linhas[] = [
                'inicioMs' => $linha->inicioMs,
                'texto' => $linha->texto,
                'traducao' => $traducoes[$indice] ?? null,
                'analise' => $analise?->paraArray(),
            ];
        }

        return [
            'uuid' => $letra->uuid()->toRfc4122(),
            'codigoFaixa' => $letra->codigoFaixa(),
            'titulo' => $letra->titulo(),
            'artista' => $letra->artista(),
            'situacao' => $letra->situacao()->value,
            'situacaoDescricao' => $letra->situacao()->descricao(),
            'traduzida' => $letra->isTraduzida(),
            'percentualAproximado' => $this->percentualAproximado($dto->analises),
            'linhas' => $linhas,
        ];
    }

    /**
     * @param list<AnalisePronunciaDTO|null> $analises
     */
    private function percentualAproximado(array $analises): int
    {
        $palavras = array_merge(...array_map(static fn (?AnalisePronunciaDTO $analise): array => $analise?->palavras() ?? [], $analises));
        if ([] === $palavras) {
            return 0;
        }

        $aproximadas = count(array_filter($palavras, static fn (PalavraPronunciadaDTO $palavra): bool => $palavra->isAproximada()));

        return (int) round($aproximadas * self::CEM / count($palavras));
    }

    public function serializarAnalise(AnalisePronunciaDTO $analise): array
    {
        return $analise->paraArray();
    }

    /**
     * @param list<RelatoErroPronuncia> $relatos
     *
     * @return list<array<string, mixed>>
     */
    public function serializarRelatos(array $relatos): array
    {
        return array_map(fn (RelatoErroPronuncia $relato): array => $this->serializarRelato($relato), $relatos);
    }

    /**
     * @return array<string, mixed>
     */
    public function serializarRelato(RelatoErroPronuncia $relato): array
    {
        $frase = $relato->frase();

        return [
            'uuid' => $relato->uuid()->toRfc4122(),
            'tipo' => $relato->tipo()->value,
            'tipoDescricao' => $relato->tipo()->descricao(),
            'status' => $relato->status()->value,
            'statusDescricao' => $relato->status()->descricao(),
            'emAberto' => $relato->isEmAberto(),
            'palavra' => $relato->palavra(),
            'comentario' => $relato->comentario(),
            'autor' => $relato->usuario()?->getNomeCompleto(),
            'textoInglesAntes' => $relato->textoInglesAntes(),
            'pronunciaAntes' => $relato->pronunciaAntes(),
            'sugestaoTraducao' => $relato->sugestaoTraducao(),
            'sugestaoPalavras' => $relato->sugestaoPalavras(),
            'explicacaoSugestao' => $relato->explicacaoSugestao(),
            'criadoEm' => $relato->criadoEm()->format(\DateTimeInterface::ATOM),
            'resolvidoEm' => $relato->resolvidoEm()?->format(\DateTimeInterface::ATOM),
            'frase' => $this->serializarFrase($frase),
        ];
    }

    /**
     * @param list<ExcecaoPronuncia> $excecoes
     *
     * @return list<array<string, mixed>>
     */
    public function serializarExcecoes(array $excecoes): array
    {
        return array_map(fn (ExcecaoPronuncia $excecao): array => $this->serializarExcecao($excecao), $excecoes);
    }

    /**
     * @return array<string, mixed>
     */
    public function serializarExcecao(ExcecaoPronuncia $excecao): array
    {
        return [
            'uuid' => $excecao->uuid()->toRfc4122(),
            'palavra' => $excecao->palavra(),
            'pronuncia' => $excecao->pronuncia(),
            'observacao' => $excecao->observacao(),
            'origem' => $excecao->origem()->value,
            'origemDescricao' => $excecao->origem()->descricao(),
            'atualizadaEm' => $excecao->atualizadaEm()->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializarResumoConsulta(ConsultaPronuncia $consulta): array
    {
        return [
            'uuid' => $consulta->uuid()->toRfc4122(),
            'favorita' => $consulta->isFavorita(),
            'vezesConsultada' => $consulta->vezesConsultada(),
            'ultimaConsultaEm' => $consulta->ultimaConsultaEm()->format(\DateTimeInterface::ATOM),
            'frase' => $this->serializarFrase($consulta->frase()),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializarFrase(FrasePronuncia $frase): array
    {
        return [
            'uuid' => $frase->uuid()->toRfc4122(),
            'idiomaOrigem' => $frase->idiomaOrigem()->value,
            'textoPortugues' => $frase->textoPortugues(),
            'textoIngles' => $frase->textoIngles(),
            'pronuncia' => $frase->pronunciaResumida(),
            'pronunciaSimples' => $frase->pronunciaSimples(),
            'status' => $frase->status()->value,
            'statusDescricao' => $frase->status()->descricao(),
        ];
    }
}
