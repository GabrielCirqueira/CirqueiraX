<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\LivroAudio;
use App\Entity\MarcacaoLivroAudio;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<MarcacaoLivroAudio>
 */
class MarcacaoLivroAudioRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MarcacaoLivroAudio::class);
    }

    public function salvar(MarcacaoLivroAudio $marcacao, bool $flush = true): void
    {
        $this->getEntityManager()->persist($marcacao);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(MarcacaoLivroAudio $marcacao, bool $flush = true): void
    {
        $this->getEntityManager()->remove($marcacao);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return list<MarcacaoLivroAudio>
     */
    public function listarDoLivro(LivroAudio $livro): array
    {
        /** @var list<MarcacaoLivroAudio> $marcacoes */
        $marcacoes = $this->createQueryBuilder('m')
            ->andWhere('m.livro = :livro')
            ->setParameter('livro', $livro->uuid()->toBinary())
            ->orderBy('m.pagina', 'ASC')
            ->addOrderBy('m.numeroBloco', 'ASC')
            ->addOrderBy('m.indiceTrecho', 'ASC')
            ->addOrderBy('m.criadoEm', 'ASC')
            ->getQuery()
            ->getResult();

        return $marcacoes;
    }

    public function contarDoLivro(LivroAudio $livro): int
    {
        return (int) $this->createQueryBuilder('m')
            ->select('COUNT(m.uuid)')
            ->andWhere('m.livro = :livro')
            ->setParameter('livro', $livro->uuid()->toBinary())
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function buscarDoLivro(LivroAudio $livro, string $uuid): ?MarcacaoLivroAudio
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->findOneBy(['uuid' => Uuid::fromString($uuid), 'livro' => $livro]);
    }
}
