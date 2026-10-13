<?php

declare(strict_types=1);

namespace App\Service\GoogleFotos;

use App\DataObject\StatusContaGoogleFotosDTO;
use App\Repository\ContaGoogleFotosRepository;

final readonly class ObterStatusContaGoogleFotosService
{
    public function __construct(
        private ContaGoogleFotosRepository $contaRepository,
        private GoogleFotosOAuthService $oAuthService,
    ) {}

    public function obterStatus(): StatusContaGoogleFotosDTO
    {
        $conta = $this->contaRepository->buscarContaAtiva();
        if (null === $conta) {
            return new StatusContaGoogleFotosDTO(
                conectado: false,
                email: null,
                conectadoEm: null,
                tokenExpirado: false,
                expiraEm: null,
            );
        }

        $agora = new \DateTimeImmutable();
        $tokenExpirado = false;

        if (null === $conta->expiraEm() || $conta->expiraEm() < $agora) {
            try {
                $this->oAuthService->obterAccessTokenValido($conta);
                $tokenExpirado = false;
            } catch (\Throwable) {
                $tokenExpirado = true;
            }
        }

        return new StatusContaGoogleFotosDTO(
            conectado: true,
            email: $conta->email(),
            conectadoEm: $conta->criadoEm()->format(\DateTimeInterface::ATOM),
            tokenExpirado: $tokenExpirado,
            expiraEm: $conta->expiraEm()?->format(\DateTimeInterface::ATOM),
        );
    }
}
