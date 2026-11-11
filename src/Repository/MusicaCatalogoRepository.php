<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\MusicaCatalogo;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MusicaCatalogo>
 */
final class MusicaCatalogoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MusicaCatalogo::class);
    }

    public function salvar(MusicaCatalogo $musica, bool $flush = true): void
    {
        $this->getEntityManager()->persist($musica);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(MusicaCatalogo $musica, bool $flush = true): void
    {
        $this->getEntityManager()->remove($musica);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorChave(Usuario $usuario, string $chaveNormalizada): ?MusicaCatalogo
    {
        /** @var MusicaCatalogo|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.chaveNormalizada = :chaveNormalizada')
            ->setParameter('usuario', $usuario)
            ->setParameter('chaveNormalizada', $chaveNormalizada)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }
}
