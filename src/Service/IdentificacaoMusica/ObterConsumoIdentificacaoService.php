<?php

declare(strict_types=1);

namespace App\Service\IdentificacaoMusica;

use App\Entity\Usuario;
use App\Enum\FinalidadeConsumoIa;
use App\Repository\ConsumoIaRepository;
use DateTimeImmutable;

final readonly class ObterConsumoIdentificacaoService
{
    private const int DIAS_PADRAO = 30;
    private const int DIAS_MAXIMO = 365;
    private const string INICIO_TOTAL = '2000-01-01';

    public function __construct(
        private ConsumoIaRepository $consumoRepository,
    ) {}

    /**
     * @return array{dias: list<array{dia: string, chamadas: int, tokensEntrada: int, tokensSaida: int, custoMicrodolares: int}>, total: array{chamadas: int, tokensEntrada: int, tokensSaida: int, custoMicrodolares: int}}
     */
    public function executar(Usuario $usuario, ?int $dias): array
    {
        $quantidade = max(1, min(self::DIAS_MAXIMO, $dias ?? self::DIAS_PADRAO));
        $finalidade = FinalidadeConsumoIa::IdentificacaoMusica;

        return [
            'dias' => $this->consumoRepository->listarPorDia($usuario, $finalidade, (new DateTimeImmutable('today'))->modify(sprintf('-%d days', $quantidade - 1))),
            'total' => $this->consumoRepository->somarDoUsuarioDesde($usuario, $finalidade, new DateTimeImmutable(self::INICIO_TOTAL)),
        ];
    }
}
