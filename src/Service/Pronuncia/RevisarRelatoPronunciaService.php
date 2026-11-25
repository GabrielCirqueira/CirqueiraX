<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\DataObject\Pronuncia\AprovarRelatoPronunciaDTO;
use App\Entity\RelatoErroPronuncia;
use App\Enum\OrigemExcecaoPronuncia;
use App\Enum\StatusRelatoPronuncia;
use App\Exception\Pronuncia\PronunciaException;
use App\Repository\FrasePronunciaRepository;
use App\Repository\RelatoErroPronunciaRepository;

final readonly class RevisarRelatoPronunciaService
{
    private const int LIMITE_LISTAGEM = 200;

    public function __construct(
        private RelatoErroPronunciaRepository $relatoRepository,
        private FrasePronunciaRepository $fraseRepository,
        private GerenciarExcecoesPronunciaService $excecoes,
        private RecalcularFrasesPronunciaService $recalcularFrases,
    ) {
    }

    /**
     * @return list<RelatoErroPronuncia>
     */
    public function listar(bool $somenteEmAberto): array
    {
        $status = $somenteEmAberto ? StatusRelatoPronuncia::emAberto() : StatusRelatoPronuncia::cases();

        return $this->relatoRepository->listarPorStatus($status, self::LIMITE_LISTAGEM);
    }

    /**
     * Aplica a correção revisada: as palavras viram exceções (valendo para todas as frases), a tradução da frase é trocada se veio corrigida e os relatos abertos da mesma frase são fechados.
     *
     * @throws PronunciaException
     */
    public function aprovar(string $uuid, AprovarRelatoPronunciaDTO $dto): RelatoErroPronuncia
    {
        $relato = $this->obterEmAberto($uuid);
        $frase = $relato->frase();
        $origem = [] === $relato->sugestaoPalavras() ? OrigemExcecaoPronuncia::Manual : OrigemExcecaoPronuncia::Ia;

        $this->excecoes->salvarLote($dto->palavras(), $origem);

        $traducao = $dto->traducao();
        if (null !== $traducao && $traducao !== $frase->traducao()) {
            $frase->corrigirTraducao($traducao);
            $this->recalcularFrases->frase($frase);
        }

        foreach ($this->relatoRepository->listarEmAbertoDaFrase($frase) as $aberto) {
            $aberto->aprovar();
        }
        $frase->marcarComoCorrigida();
        $this->fraseRepository->salvar($frase, flush: false);
        $this->relatoRepository->flush();

        return $relato;
    }

    /**
     * @throws PronunciaException
     */
    public function rejeitar(string $uuid): RelatoErroPronuncia
    {
        $relato = $this->obterEmAberto($uuid);
        $relato->rejeitar();
        $this->relatoRepository->salvar($relato);

        return $relato;
    }

    private function obterEmAberto(string $uuid): RelatoErroPronuncia
    {
        $relato = $this->relatoRepository->buscarPorUuid($uuid) ?? throw PronunciaException::relatoNaoEncontrado();
        if (!$relato->isEmAberto()) {
            throw PronunciaException::relatoJaResolvido();
        }

        return $relato;
    }
}
