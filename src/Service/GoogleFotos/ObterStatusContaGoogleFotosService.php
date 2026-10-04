<?php

declare(strict_types=1);

namespace App\Service\GoogleFotos;

use App\DataObject\StatusContaGoogleFotosDTO;
use App\Repository\ContaGoogleFotosRepository;

final readonly class ObterStatusContaGoogleFotosService
{
    public function __construct(
        private ContaGoogleFotosRepository $contaRepository,
    ) {}

    public function obterStatus(): StatusContaGoogleFotosDTO
    {
        $conta = $this->contaRepository->buscarContaAtiva();
        if (null === $conta) {
            return new StatusContaGoogleFotosDTO(
                conectado: false,
                email: null,
                conectadoEm: null,
            );
        }

        return new StatusContaGoogleFotosDTO(
            conectado: true,
            email: $conta->email(),
            conectadoEm: $conta->criadoEm()->format(\DateTimeInterface::ATOM),
        );
    }
}
