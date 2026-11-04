<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\LivroAudio;
use App\Entity\LivroAudioBloco;
use App\Entity\LivroAudioBlocoVoz;
use App\Enum\StatusLivroAudioBloco;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<LivroAudioBlocoVoz>
 */
class LivroAudioBlocoVozRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LivroAudioBlocoVoz::class);
    }

    public function salvar(LivroAudioBlocoVoz $blocoVoz, bool $flush = true): void
    {
        $this->getEntityManager()->persist($blocoVoz);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(LivroAudioBlocoVoz $blocoVoz, bool $flush = true): void
    {
        $this->getEntityManager()->remove($blocoVoz);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorUuid(string $uuid): ?LivroAudioBlocoVoz
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->find(Uuid::fromString($uuid));
    }

    public function existe(string $uuid): bool
    {
        return false !== $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT 1 FROM livro_audio_bloco_voz WHERE uuid = ?',
            [Uuid::fromString($uuid)->toBinary()],
        );
    }

    public function foiReiniciado(string $uuid): bool
    {
        return StatusLivroAudioBloco::PENDENTE->value === $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT status FROM livro_audio_bloco_voz WHERE uuid = ?',
            [Uuid::fromString($uuid)->toBinary()],
        );
    }

    public function buscarPorBlocoEVoz(LivroAudioBloco $bloco, string $voz): ?LivroAudioBlocoVoz
    {
        return $this->findOneBy([
            'bloco' => $bloco,
            'voz' => $voz,
        ]);
    }

    /**
     * @return list<LivroAudioBlocoVoz>
     */
    public function listarPorLivro(LivroAudio $livro, ?string $voz = null): array
    {
        $consulta = $this->createQueryBuilder('v')
            ->innerJoin('v.bloco', 'b')
            ->andWhere('b.livro = :livro')
            ->setParameter('livro', $livro->uuid()->toBinary())
            ->orderBy('b.numeroBloco', 'ASC');

        if (null !== $voz) {
            $consulta->andWhere('v.voz = :voz')->setParameter('voz', $voz);
        }

        /** @var list<LivroAudioBlocoVoz> $vozes */
        $vozes = $consulta->getQuery()->getResult();

        return $vozes;
    }
}
