<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ConsumoIa;
use App\Entity\Usuario;
use App\Enum\FinalidadeConsumoIa;
use DateTimeImmutable;
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
}
