<?php

declare(strict_types=1);

namespace App\Service\Ia;

use App\Interface\ProvedorIaInterface;

final readonly class ListarProvedoresIaService
{
    /**
     * @param iterable<ProvedorIaInterface> $provedores
     */
    public function __construct(
        private iterable $provedores,
        private bool $permitirPagos,
    ) {
    }

    /**
     * @return list<ProvedorIaInterface>
     */
    public function todos(): array
    {
        return array_values([...$this->provedores]);
    }

    /**
     * Provedores com chave configurada e que o pool pode usar (os pagos só quando liberados), na ordem de prioridade.
     *
     * @return list<ProvedorIaInterface>
     */
    public function permitidos(): array
    {
        return array_values(array_filter($this->todos(), $this->isPermitido(...)));
    }

    public function isPermitido(ProvedorIaInterface $provedor): bool
    {
        return $provedor->isConfigurado() && ($this->permitirPagos || $provedor->isGratuito());
    }
}
