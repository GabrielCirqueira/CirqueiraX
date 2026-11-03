<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\LivroAudio;
use App\Entity\LivroAudioBloco;
use App\Enum\StatusLivroAudioBloco;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<LivroAudioBloco>
 */
class LivroAudioBlocoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LivroAudioBloco::class);
    }

    public function salvar(LivroAudioBloco $bloco, bool $flush = true): void
    {
        $this->getEntityManager()->persist($bloco);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(LivroAudioBloco $bloco, bool $flush = true): void
    {
        $this->getEntityManager()->remove($bloco);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorUuid(string $uuid): ?LivroAudioBloco
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->find(Uuid::fromString($uuid));
    }

    public function buscarPorLivroENumero(LivroAudio $livro, int $numeroBloco): ?LivroAudioBloco
    {
        return $this->findOneBy([
            'livro' => $livro,
            'numeroBloco' => $numeroBloco,
        ]);
    }

    /**
     * @return list<LivroAudioBloco>
     */
    public function listarPorLivro(LivroAudio $livro): array
    {
        /** @var list<LivroAudioBloco> $blocos */
        $blocos = $this->createQueryBuilder('b')
            ->andWhere('b.livro = :livro')
            ->setParameter('livro', $livro->uuid()->toBinary())
            ->orderBy('b.numeroBloco', 'ASC')
            ->getQuery()
            ->getResult();

        return $blocos;
    }

    /**
     * @return list<LivroAudioBloco>
     */
    public function listarPendentesParaGeracao(int $limite = 10): array
    {
        /** @var list<LivroAudioBloco> $blocos */
        $blocos = $this->createQueryBuilder('b')
            ->andWhere('b.status = :status')
            ->setParameter('status', StatusLivroAudioBloco::PENDENTE)
            ->orderBy('b.criadoEm', 'ASC')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $blocos;
    }

    /**
     * @return list<LivroAudioBloco>
     */
    public function listarNaoProntosDoLivro(LivroAudio $livro): array
    {
        /** @var list<LivroAudioBloco> $blocos */
        $blocos = $this->createQueryBuilder('b')
            ->andWhere('b.livro = :livro')
            ->andWhere('b.status != :statusPronto')
            ->setParameter('livro', $livro->uuid()->toBinary())
            ->setParameter('statusPronto', StatusLivroAudioBloco::PRONTO)
            ->orderBy('b.numeroBloco', 'ASC')
            ->getQuery()
            ->getResult();

        return $blocos;
    }
}
