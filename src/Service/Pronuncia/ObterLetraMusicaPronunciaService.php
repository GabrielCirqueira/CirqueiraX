<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\DataObject\Pronuncia\BuscarLetraMusicaDTO;
use App\DataObject\Pronuncia\LetraMusicaPronunciadaDTO;
use App\Entity\LetraMusicaPronuncia;
use App\Interface\BuscadorLetraMusicaInterface;
use App\Repository\LetraMusicaPronunciaRepository;

final readonly class ObterLetraMusicaPronunciaService
{
    public function __construct(
        private LetraMusicaPronunciaRepository $letraRepository,
        private BuscadorLetraMusicaInterface $buscadorLetra,
        private GerarAnalisePronunciaService $gerarAnalise,
    ) {
    }

    /**
     * Busca a letra uma vez só por faixa (fica salva) e gera a pronúncia de cada linha na hora, para já sair com as correções aprovadas.
     */
    public function executar(BuscarLetraMusicaDTO $dto): LetraMusicaPronunciadaDTO
    {
        $letra = $this->letraRepository->buscarPorCodigoFaixa($dto->codigoFaixa)
            ?? $this->buscarNova($dto);

        if ($letra->isHoraDeBuscarDeNovo()) {
            $letra->atualizarLetra($this->buscadorLetra->buscar($dto->titulo, $dto->artista, $dto->album(), $dto->duracaoMs));
            $this->letraRepository->salvar($letra);
        }

        return $this->pronunciar($letra);
    }

    public function pronunciar(LetraMusicaPronuncia $letra): LetraMusicaPronunciadaDTO
    {
        $analises = $letra->situacao()->temLinhas() ? $this->gerarAnalise->executarLinhas($letra->textosDasLinhas()) : [];

        return new LetraMusicaPronunciadaDTO($letra, $analises);
    }

    private function buscarNova(BuscarLetraMusicaDTO $dto): LetraMusicaPronuncia
    {
        $encontrada = $this->buscadorLetra->buscar($dto->titulo, $dto->artista, $dto->album(), $dto->duracaoMs);
        $letra = new LetraMusicaPronuncia($dto->codigoFaixa, $dto->titulo, $dto->artista, $dto->album(), $dto->duracaoMs, $encontrada);
        $this->letraRepository->salvar($letra);

        return $letra;
    }
}
