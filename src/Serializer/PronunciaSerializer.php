<?php

declare(strict_types=1);

namespace App\Serializer;

use App\DataObject\Pronuncia\AnalisePronunciaDTO;
use App\Entity\ConsultaPronuncia;
use App\Entity\ExcecaoPronuncia;
use App\Entity\FrasePronuncia;
use App\Entity\RelatoErroPronuncia;

final readonly class PronunciaSerializer
{
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
            'status' => $frase->status()->value,
            'statusDescricao' => $frase->status()->descricao(),
        ];
    }
}
