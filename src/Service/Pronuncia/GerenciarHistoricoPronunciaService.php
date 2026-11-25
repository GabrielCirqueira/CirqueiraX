<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\DataObject\Pronuncia\FiltroHistoricoPronunciaDTO;
use App\DataObject\Pronuncia\PaginaHistoricoPronunciaDTO;
use App\Entity\ConsultaPronuncia;
use App\Entity\Usuario;
use App\Exception\Pronuncia\PronunciaException;
use App\Repository\ConsultaPronunciaRepository;

final readonly class GerenciarHistoricoPronunciaService
{
    public function __construct(
        private ConsultaPronunciaRepository $consultaRepository,
    ) {
    }

    public function listar(Usuario $usuario, FiltroHistoricoPronunciaDTO $filtro): PaginaHistoricoPronunciaDTO
    {
        return new PaginaHistoricoPronunciaDTO(
            $this->consultaRepository->listarDoUsuario($usuario, $filtro->isSomenteFavoritas(), $filtro->busca(), $filtro->pagina(), $filtro->limite()),
            $this->consultaRepository->contarDoUsuario($usuario, $filtro->isSomenteFavoritas(), $filtro->busca()),
        );
    }

    /**
     * @throws PronunciaException
     */
    public function obter(Usuario $usuario, string $uuid): ConsultaPronuncia
    {
        return $this->consultaRepository->buscarDoUsuario($usuario, $uuid) ?? throw PronunciaException::consultaNaoEncontrada();
    }

    /**
     * @throws PronunciaException
     */
    public function favoritar(Usuario $usuario, string $uuid, bool $favorita): ConsultaPronuncia
    {
        $consulta = $this->obter($usuario, $uuid);
        $consulta->definirFavorita($favorita);
        $this->consultaRepository->salvar($consulta);

        return $consulta;
    }

    /**
     * @throws PronunciaException
     */
    public function apagar(Usuario $usuario, string $uuid): void
    {
        $this->consultaRepository->remover($this->obter($usuario, $uuid));
    }
}
