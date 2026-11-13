<?php

declare(strict_types=1);

namespace App\Service\Ia;

use App\Enum\ProvedorIa;
use App\Exception\Ia\ProvedorIaException;
use App\Repository\EstadoProvedorIaRepository;
use DateTimeImmutable;

final readonly class AtualizarEstadoProvedorIaService
{
    public function __construct(
        private EstadoProvedorIaRepository $estadoRepository,
    ) {
    }

    public function isDisponivel(ProvedorIa $provedor): bool
    {
        return $this->estadoRepository->buscarOuCriar($provedor)->isDisponivel(new DateTimeImmutable());
    }

    public function registrarSucesso(ProvedorIa $provedor): void
    {
        $estado = $this->estadoRepository->buscarOuCriar($provedor)->registrarSucesso(new DateTimeImmutable());
        $this->estadoRepository->salvar($estado);
    }

    public function registrarFalha(ProvedorIaException $erro): void
    {
        $agora = new DateTimeImmutable();
        $estado = $this->estadoRepository->buscarOuCriar($erro->provedor());
        $motivo = $erro->getMessage();

        $atualizado = match (true) {
            $erro->isLimiteAtingido() => $estado->registrarLimiteAtingido($erro->esperaSegundos(), $motivo, $agora),
            $erro->isAcessoNegado() => $estado->registrarAcessoNegado($motivo, $agora),
            default => $estado->registrarFalha($motivo, $agora),
        };
        $this->estadoRepository->salvar($atualizado);
    }

    public function desbloquear(ProvedorIa $provedor): void
    {
        $this->estadoRepository->salvar($this->estadoRepository->buscarOuCriar($provedor)->desbloquear());
    }
}
