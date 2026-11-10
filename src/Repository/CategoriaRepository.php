<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Categoria;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<Categoria>
 */
class CategoriaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Categoria::class);
    }

    public function salvar(Categoria $categoria, bool $flush = true): void
    {
        $this->getEntityManager()->persist($categoria);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(Categoria $categoria, bool $flush = true): void
    {
        $this->getEntityManager()->remove($categoria);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function buscarPorNome(Usuario $usuario, string $nome): ?Categoria
    {
        return $this->findOneBy(['usuario' => $usuario, 'nome' => $nome]);
    }

    public function buscarDoUsuario(Uuid|string $uuid, Usuario $usuario): ?Categoria
    {
        if (is_string($uuid) && !Uuid::isValid($uuid)) {
            return null;
        }

        return $this->findOneBy(['uuid' => is_string($uuid) ? Uuid::fromString($uuid) : $uuid, 'usuario' => $usuario]);
    }

    public function buscarPorUuid(Uuid|string $uuid): ?Categoria
    {
        if (is_string($uuid)) {
            $uuid = Uuid::fromString($uuid);
        }

        return $this->find($uuid);
    }

    public function existeComNome(Usuario $usuario, string $nome, Uuid|string|null $ignorarUuid = null): bool
    {
        $qb = $this->createQueryBuilder('c')
            ->select('COUNT(c.uuid)')
            ->where('c.usuario = :usuario')
            ->andWhere('c.nome = :nome')
            ->setParameter('usuario', $usuario)
            ->setParameter('nome', $nome);

        if (null !== $ignorarUuid) {
            $uuidStr = is_string($ignorarUuid) ? $ignorarUuid : $ignorarUuid->toString();
            $qb->andWhere('c.uuid != :ignorarUuid')
               ->setParameter('ignorarUuid', $uuidStr);
        }

        return (int) $qb->getQuery()->getSingleScalarResult() > 0;
    }

    /**
     * @return list<Categoria>
     */
    public function listarTodas(Usuario $usuario): array
    {
        /** @var list<Categoria> $resultado */
        $resultado = $this->findBy(['usuario' => $usuario], ['nome' => 'ASC']);

        return $resultado;
    }

    /**
     * @return array{itens: array<int, Categoria>, total: int}
     */
    public function listarPaginado(Usuario $usuario, int $pagina = 1, int $limite = 20): array
    {
        $offset = ($pagina - 1) * $limite;

        $qb = $this->createQueryBuilder('c')
            ->where('c.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->orderBy('c.criadoEm', 'DESC')
            ->setFirstResult($offset)
            ->setMaxResults($limite);

        /** @var array<int, Categoria> $itens */
        $itens = $qb->getQuery()->getResult();

        $totalQb = $this->createQueryBuilder('c')
            ->select('COUNT(c.uuid)')
            ->where('c.usuario = :usuario')
            ->setParameter('usuario', $usuario);

        $total = (int) $totalQb->getQuery()->getSingleScalarResult();

        return [
            'itens' => $itens,
            'total' => $total,
        ];
    }
}
