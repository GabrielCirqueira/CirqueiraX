<?php

declare(strict_types=1);

namespace App\Repository;

use App\DataObject\PaginaAudiosDTO;
use App\Entity\Audio;
use App\Entity\Usuario;
use App\Enum\StatusAudio;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<Audio>
 */
class AudioRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Audio::class);
    }

    public function salvar(Audio $audio, bool $flush = true): void
    {
        $this->getEntityManager()->persist($audio);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(Audio $audio): void
    {
        $this->getEntityManager()->remove($audio);
        $this->getEntityManager()->flush();
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorUuid(string $uuid): ?Audio
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->find(Uuid::fromString($uuid));
    }

    public function buscarDoUsuario(string $uuid, Usuario $usuario): ?Audio
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->findOneBy(['uuid' => Uuid::fromString($uuid), 'usuario' => $usuario]);
    }

    public function paginarDoUsuario(Usuario $usuario, int $pagina, int $limite): PaginaAudiosDTO
    {
        $consulta = $this->createQueryBuilder('a')
            ->andWhere('a.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->orderBy('a.criadoEm', 'DESC');

        $total = (int) (clone $consulta)->select('COUNT(a.uuid)')->resetDQLPart('orderBy')->getQuery()->getSingleScalarResult();

        /** @var list<Audio> $audios */
        $audios = $consulta
            ->setFirstResult(($pagina - 1) * $limite)
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return new PaginaAudiosDTO($audios, $total);
    }

    /**
     * @return list<Audio>
     */
    public function buscarDisponiveisBaixadosAntesDe(DateTimeImmutable $limite): array
    {
        /** @var list<Audio> $audios */
        $audios = $this->createQueryBuilder('a')
            ->andWhere('a.status = :status')
            ->andWhere('a.baixadoEm < :limite')
            ->setParameter('status', StatusAudio::DISPONIVEL)
            ->setParameter('limite', $limite)
            ->getQuery()
            ->getResult();

        return $audios;
    }

    /**
     * @return list<Audio>
     */
    public function buscarEmProcessamentoAtualizadosAntesDe(DateTimeImmutable $limite): array
    {
        /** @var list<Audio> $audios */
        $audios = $this->createQueryBuilder('a')
            ->andWhere('a.status IN (:status)')
            ->andWhere('a.atualizadoEm < :limite')
            ->setParameter('status', [StatusAudio::PENDENTE, StatusAudio::BAIXANDO])
            ->setParameter('limite', $limite)
            ->getQuery()
            ->getResult();

        return $audios;
    }
}
