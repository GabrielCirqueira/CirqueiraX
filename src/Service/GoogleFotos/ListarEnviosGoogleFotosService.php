<?php

declare(strict_types=1);

namespace App\Service\GoogleFotos;

use App\DataObject\FiltroEnviosGoogleFotosDTO;
use App\DataObject\PaginaRegistrosEnvioGoogleFotosDTO;
use App\Enum\StatusEnvioGoogleFotos;
use App\Repository\RegistroEnvioGoogleFotosRepository;
use DateTimeImmutable;
use DateTimeInterface;

final readonly class ListarEnviosGoogleFotosService
{
    private const string PERIODO_RESUMO = '-24 hours';

    public function __construct(
        private RegistroEnvioGoogleFotosRepository $registroRepository,
    ) {}

    public function listar(FiltroEnviosGoogleFotosDTO $filtro): PaginaRegistrosEnvioGoogleFotosDTO
    {
        return $this->registroRepository->paginarRecentes($filtro->status(), $filtro->pagina(), $filtro->limite());
    }

    /**
     * @return array{enviados: int, reaproveitados: int, falhas: int, enviando: int, ultimaFalhaEm: string|null, ultimaFalhaMotivo: string|null}
     */
    public function resumirUltimas24Horas(): array
    {
        $contagem = $this->registroRepository->contarPorStatusDesde(new DateTimeImmutable(self::PERIODO_RESUMO));
        $ultimaFalha = $this->registroRepository->buscarUltimaFalha();

        return [
            'enviados' => $contagem[StatusEnvioGoogleFotos::ENVIADO->value] ?? 0,
            'reaproveitados' => $contagem[StatusEnvioGoogleFotos::REAPROVEITADO->value] ?? 0,
            'falhas' => $contagem[StatusEnvioGoogleFotos::FALHA->value] ?? 0,
            'enviando' => $contagem[StatusEnvioGoogleFotos::ENVIANDO->value] ?? 0,
            'ultimaFalhaEm' => $ultimaFalha?->iniciadoEm()->format(DateTimeInterface::ATOM),
            'ultimaFalhaMotivo' => $ultimaFalha?->erroMotivo(),
        ];
    }
}
