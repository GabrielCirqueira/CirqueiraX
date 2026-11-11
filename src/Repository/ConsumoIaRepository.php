<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ConsumoIa;
use App\Entity\Usuario;
use App\Enum\FinalidadeConsumoIa;
use DateTimeImmutable;
use DateTimeZone;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ConsumoIa>
 */
final class ConsumoIaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ConsumoIa::class);
    }

    public function salvar(ConsumoIa $consumo, bool $flush = true): void
    {
        $this->getEntityManager()->persist($consumo);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return array{chamadas: int, tokensEntrada: int, tokensSaida: int, custoMicrodolares: int}
     */
    public function somarDoUsuarioDesde(Usuario $usuario, FinalidadeConsumoIa $finalidade, DateTimeImmutable $desde): array
    {
        /** @var array{chamadas: int|string, tokensEntrada: int|string|null, tokensSaida: int|string|null, custoMicrodolares: int|string|null} $linha */
        $linha = $this->createQueryBuilder('c')
            ->select('COUNT(c.uuid) AS chamadas, SUM(c.tokensEntrada) AS tokensEntrada, SUM(c.tokensSaida) AS tokensSaida, SUM(c.custoMicrodolares) AS custoMicrodolares')
            ->andWhere('c.usuario = :usuario')
            ->andWhere('c.finalidade = :finalidade')
            ->andWhere('c.criadoEm >= :desde')
            ->setParameter('usuario', $usuario)
            ->setParameter('finalidade', $finalidade)
            ->setParameter('desde', $desde)
            ->getQuery()
            ->getSingleResult();

        return [
            'chamadas' => (int) $linha['chamadas'],
            'tokensEntrada' => (int) $linha['tokensEntrada'],
            'tokensSaida' => (int) $linha['tokensSaida'],
            'custoMicrodolares' => (int) $linha['custoMicrodolares'],
        ];
    }

    /**
     * @return list<array{dia: string, chamadas: int, tokensEntrada: int, tokensSaida: int, custoMicrodolares: int}>
     */
    public function listarPorDia(Usuario $usuario, FinalidadeConsumoIa $finalidade, DateTimeImmutable $desde): array
    {
        /** @var list<array{dia: string, chamadas: int|string, tokens_entrada: int|string|null, tokens_saida: int|string|null, custo: int|string|null}> $linhas */
        $linhas = $this->getEntityManager()->getConnection()->fetchAllAssociative(
            "SELECT DATE(CONVERT_TZ(criado_em, '+00:00', '-03:00')) AS dia, COUNT(*) AS chamadas, SUM(tokens_entrada) AS tokens_entrada,
                SUM(tokens_saida) AS tokens_saida, SUM(custo_microdolares) AS custo
            FROM consumo_ia
            WHERE usuario_id = :usuarioId AND finalidade = :finalidade AND criado_em >= :desde
            GROUP BY dia
            ORDER BY dia DESC",
            [
                'usuarioId' => $usuario->getId(),
                'finalidade' => $finalidade->value,
                'desde' => $desde->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s'),
            ],
        );

        return array_map(static fn (array $linha): array => [
            'dia' => (string) $linha['dia'],
            'chamadas' => (int) $linha['chamadas'],
            'tokensEntrada' => (int) $linha['tokens_entrada'],
            'tokensSaida' => (int) $linha['tokens_saida'],
            'custoMicrodolares' => (int) $linha['custo'],
        ], $linhas);
    }
}
