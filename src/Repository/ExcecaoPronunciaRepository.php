<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ExcecaoPronuncia;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<ExcecaoPronuncia>
 */
final class ExcecaoPronunciaRepository extends ServiceEntityRepository
{
    private const string CURINGA_LIKE = '%';

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ExcecaoPronuncia::class);
    }

    public function salvar(ExcecaoPronuncia $excecao, bool $flush = true): void
    {
        $this->getEntityManager()->persist($excecao);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ExcecaoPronuncia $excecao): void
    {
        $this->getEntityManager()->remove($excecao);
        $this->getEntityManager()->flush();
    }

    public function buscarPorUuid(string $uuid): ?ExcecaoPronuncia
    {
        return Uuid::isValid($uuid) ? $this->find(Uuid::fromString($uuid)) : null;
    }

    public function buscarPorPalavra(string $palavra): ?ExcecaoPronuncia
    {
        return $this->findOneBy(['palavra' => $palavra]);
    }

    /**
     * @param list<string> $palavras
     *
     * @return array<string, string>
     */
    public function mapaPorPalavras(array $palavras): array
    {
        if ([] === $palavras) {
            return [];
        }

        /** @var list<ExcecaoPronuncia> $excecoes */
        $excecoes = $this->createQueryBuilder('e')
            ->andWhere('e.palavra IN (:palavras)')
            ->setParameter('palavras', array_values(array_unique($palavras)))
            ->getQuery()
            ->getResult();

        $mapa = [];
        foreach ($excecoes as $excecao) {
            $mapa[$excecao->palavra()] = $excecao->pronuncia();
        }

        return $mapa;
    }

    /**
     * @return list<ExcecaoPronuncia>
     */
    public function listar(?string $busca, int $limite): array
    {
        $consulta = $this->createQueryBuilder('e')
            ->orderBy('e.atualizadaEm', 'DESC')
            ->setMaxResults($limite);

        if (null !== $busca) {
            $consulta->andWhere('e.palavra LIKE :busca')
                ->setParameter('busca', self::CURINGA_LIKE.addcslashes(mb_strtolower($busca), '%_\\').self::CURINGA_LIKE);
        }

        /** @var list<ExcecaoPronuncia> $excecoes */
        $excecoes = $consulta->getQuery()->getResult();

        return $excecoes;
    }

    public function contar(): int
    {
        return $this->count([]);
    }
}
