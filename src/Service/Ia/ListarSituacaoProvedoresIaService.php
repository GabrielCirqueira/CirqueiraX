<?php

declare(strict_types=1);

namespace App\Service\Ia;

use App\DataObject\Ia\SituacaoProvedorIaDTO;
use App\Entity\EstadoProvedorIa;
use App\Interface\ProvedorIaInterface;
use App\Repository\EstadoProvedorIaRepository;

final readonly class ListarSituacaoProvedoresIaService
{
    public function __construct(
        private ListarProvedoresIaService $listarProvedores,
        private EstadoProvedorIaRepository $estadoRepository,
    ) {
    }

    /**
     * @return list<SituacaoProvedorIaDTO>
     */
    public function executar(): array
    {
        $estados = $this->estadoRepository->listarPorProvedor();

        return array_map(
            fn (ProvedorIaInterface $provedor): SituacaoProvedorIaDTO => $this->montarSituacao($provedor, $estados[$provedor->provedor()->value] ?? new EstadoProvedorIa($provedor->provedor())),
            $this->listarProvedores->todos(),
        );
    }

    private function montarSituacao(ProvedorIaInterface $provedor, EstadoProvedorIa $estado): SituacaoProvedorIaDTO
    {
        return new SituacaoProvedorIaDTO(
            $provedor->provedor(),
            $provedor->modelo(),
            $provedor->isConfigurado(),
            $provedor->isGratuito(),
            $this->listarProvedores->isPermitido($provedor),
            $estado->bloqueadoAte(),
            $estado->motivoBloqueio(),
            $estado->totalSucessos(),
            $estado->totalFalhas(),
            $estado->ultimoSucessoEm(),
        );
    }
}
