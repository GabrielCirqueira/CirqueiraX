<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\DataObject\Pronuncia\PainelPronunciaDTO;
use App\DataObject\Pronuncia\UsoTraducaoDTO;
use App\Exception\Pronuncia\TraducaoException;
use App\Interface\TradutorTextoInterface;
use App\Repository\ExcecaoPronunciaRepository;
use App\Repository\FrasePronunciaRepository;
use App\Repository\PalavraDicionarioPronunciaRepository;
use App\Repository\RelatoErroPronunciaRepository;

final readonly class ConsultarPainelPronunciaService
{
    public function __construct(
        private PalavraDicionarioPronunciaRepository $dicionarioRepository,
        private ExcecaoPronunciaRepository $excecaoRepository,
        private FrasePronunciaRepository $fraseRepository,
        private RelatoErroPronunciaRepository $relatoRepository,
        private TradutorTextoInterface $tradutor,
    ) {
    }

    public function executar(): PainelPronunciaDTO
    {
        return new PainelPronunciaDTO(
            $this->dicionarioRepository->contar(),
            $this->excecaoRepository->contar(),
            $this->fraseRepository->contar(),
            $this->relatoRepository->contarEmAberto(),
            $this->consultarUso(),
        );
    }

    private function consultarUso(): UsoTraducaoDTO
    {
        try {
            return $this->tradutor->consultarUso();
        } catch (TraducaoException) {
            return UsoTraducaoDTO::naoConfigurado();
        }
    }
}
