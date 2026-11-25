<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\Exception\Pronuncia\PronunciaException;
use App\Interface\LeitorDicionarioPronunciaInterface;
use App\Repository\PalavraDicionarioPronunciaRepository;

final readonly class ImportarDicionarioPronunciaService
{
    private const int TAMANHO_LOTE = 2000;

    public function __construct(
        private LeitorDicionarioPronunciaInterface $leitor,
        private PalavraDicionarioPronunciaRepository $dicionarioRepository,
    ) {
    }

    /**
     * Recarrega o dicionário de pronúncia do arquivo para o banco. Pode ser rodado de novo sem duplicar nada.
     *
     * @param \Closure(int): void $aoProgredir recebe o total importado até o momento
     *
     * @throws PronunciaException
     */
    public function executar(\Closure $aoProgredir): int
    {
        $this->dicionarioRepository->apagarTudo();
        $lote = [];
        $total = 0;

        foreach ($this->leitor->ler() as $entrada) {
            $lote[] = $entrada;
            if (count($lote) < self::TAMANHO_LOTE) {
                continue;
            }

            $total += $this->gravar($lote, $aoProgredir, $total);
            $lote = [];
        }

        return $total + $this->gravar($lote, $aoProgredir, $total);
    }

    /**
     * @param list<array{palavra: string, variante: int, fonemas: string}> $lote
     * @param \Closure(int): void                                          $aoProgredir
     */
    private function gravar(array $lote, \Closure $aoProgredir, int $totalAnterior): int
    {
        $this->dicionarioRepository->inserirLote($lote);
        $aoProgredir($totalAnterior + count($lote));

        return count($lote);
    }
}
