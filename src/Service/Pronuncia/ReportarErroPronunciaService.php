<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\DataObject\Pronuncia\ReportarErroPronunciaDTO;
use App\Entity\RelatoErroPronuncia;
use App\Entity\Usuario;
use App\Exception\Pronuncia\PronunciaException;
use App\Repository\FrasePronunciaRepository;
use App\Repository\RelatoErroPronunciaRepository;

final readonly class ReportarErroPronunciaService
{
    public function __construct(
        private GerenciarHistoricoPronunciaService $historico,
        private FrasePronunciaRepository $fraseRepository,
        private RelatoErroPronunciaRepository $relatoRepository,
    ) {
    }

    /**
     * Guarda o relato na fila de correções e marca a frase como reportada.
     *
     * @throws PronunciaException
     */
    public function executar(Usuario $usuario, string $uuidConsulta, ReportarErroPronunciaDTO $dto): RelatoErroPronuncia
    {
        $frase = $this->historico->obter($usuario, $uuidConsulta)->frase();
        $relato = new RelatoErroPronuncia($frase, $usuario, $dto->tipo(), $dto->palavra(), $dto->comentario());

        $frase->marcarComoReportada();
        $this->fraseRepository->salvar($frase, flush: false);
        $this->relatoRepository->salvar($relato);

        return $relato;
    }
}
