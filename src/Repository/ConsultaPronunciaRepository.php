<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ConsultaPronuncia;
use App\Entity\FrasePronuncia;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<ConsultaPronuncia>
 */
final class ConsultaPronunciaRepository extends ServiceEntityRepository
{
    private const string CURINGA_LIKE = '%';

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ConsultaPronuncia::class);
    }

    public function salvar(ConsultaPronuncia $consulta, bool $flush = true): void
    {
        $this->getEntityManager()->persist($consulta);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ConsultaPronuncia $consulta): void
    {
        $this->getEntityManager()->remove($consulta);
        $this->getEntityManager()->flush();
    }

    public function buscarDoUsuarioPorFrase(Usuario $usuario, FrasePronuncia $frase): ?ConsultaPronuncia
    {
        return $this->findOneBy(['usuario' => $usuario, 'frase' => $frase]);
    }

    public function buscarDoUsuario(Usuario $usuario, string $uuid): ?ConsultaPronuncia
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->findOneBy(['uuid' => Uuid::fromString($uuid), 'usuario' => $usuario]);
    }

    /**
     * @return list<ConsultaPronuncia>
     */
    public function listarDoUsuario(Usuario $usuario, bool $somenteFavoritas, ?string $busca, int $pagina, int $limite): array
    {
        /** @var list<ConsultaPronuncia> $consultas */
        $consultas = $this->montarConsulta($usuario, $somenteFavoritas, $busca)
            ->addSelect('f')
            ->orderBy('c.ultimaConsultaEm', 'DESC')
            ->setFirstResult(($pagina - 1) * $limite)
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $consultas;
    }

    public function contarDoUsuario(Usuario $usuario, bool $somenteFavoritas, ?string $busca): int
    {
        return (int) $this->montarConsulta($usuario, $somenteFavoritas, $busca)
            ->select('COUNT(c.uuid)')
            ->getQuery()
            ->getSingleScalarResult();
    }

    private function montarConsulta(Usuario $usuario, bool $somenteFavoritas, ?string $busca): QueryBuilder
    {
        $consulta = $this->createQueryBuilder('c')
            ->innerJoin('c.frase', 'f')
            ->andWhere('c.usuario = :usuario')
            ->setParameter('usuario', $usuario);

        if ($somenteFavoritas) {
            $consulta->andWhere('c.favorita = true');
        }

        if (null !== $busca) {
            $consulta->andWhere('LOWER(f.textoPortugues) LIKE :busca OR LOWER(f.textoIngles) LIKE :busca')
                ->setParameter('busca', self::CURINGA_LIKE.addcslashes(mb_strtolower($busca), '%_\\').self::CURINGA_LIKE);
        }

        return $consulta;
    }
}
