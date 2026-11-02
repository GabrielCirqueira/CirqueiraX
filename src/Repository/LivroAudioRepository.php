<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\LivroAudio;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<LivroAudio>
 */
class LivroAudioRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LivroAudio::class);
    }

    public function salvar(LivroAudio $livroAudio, bool $flush = true): void
    {
        $this->getEntityManager()->persist($livroAudio);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(LivroAudio $livroAudio, bool $flush = true): void
    {
        $this->getEntityManager()->remove($livroAudio);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorUuid(string $uuid): ?LivroAudio
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->find(Uuid::fromString($uuid));
    }

    public function buscarDoUsuario(string $uuid, Usuario $usuario): ?LivroAudio
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->findOneBy(['uuid' => Uuid::fromString($uuid), 'usuario' => $usuario]);
    }

    /**
     * @return list<LivroAudio>
     */
    public function listarDoUsuario(Usuario $usuario): array
    {
        /** @var list<LivroAudio> $livros */
        $livros = $this->createQueryBuilder('l')
            ->andWhere('l.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->orderBy('l.criadoEm', 'DESC')
            ->getQuery()
            ->getResult();

        return $livros;
    }
}
