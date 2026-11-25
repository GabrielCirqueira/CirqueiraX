<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\DataObject\Pronuncia\LetraMusicaPronunciadaDTO;
use App\Enum\IdiomaFrase;
use App\Exception\Pronuncia\LetraMusicaException;
use App\Interface\TradutorTextoInterface;
use App\Repository\LetraMusicaPronunciaRepository;

final readonly class TraduzirLetraMusicaService
{
    public function __construct(
        private LetraMusicaPronunciaRepository $letraRepository,
        private TradutorTextoInterface $tradutor,
        private ObterLetraMusicaPronunciaService $obterLetraService,
    ) {
    }

    /**
     * Traduz as linhas da letra para português uma única vez; linhas repetidas (refrão) e vazias não gastam cota.
     */
    public function executar(string $uuid): LetraMusicaPronunciadaDTO
    {
        $letra = $this->letraRepository->buscarPorUuid($uuid) ?? throw LetraMusicaException::letraNaoEncontrada();
        if ($letra->isTraduzida()) {
            return $this->obterLetraService->pronunciar($letra);
        }

        $textos = $letra->textosDasLinhas();
        $unicos = array_values(array_unique(array_filter($textos, static fn (string $texto): bool => '' !== $texto)));
        if ([] === $unicos) {
            throw LetraMusicaException::semLinhasParaTraduzir();
        }

        $traduzidos = array_combine($unicos, $this->tradutor->traduzirLote($unicos, IdiomaFrase::Portugues));
        $letra->definirTraducoes(array_map(static fn (string $texto): string => $traduzidos[$texto] ?? '', $textos));
        $this->letraRepository->salvar($letra);

        return $this->obterLetraService->pronunciar($letra);
    }
}
