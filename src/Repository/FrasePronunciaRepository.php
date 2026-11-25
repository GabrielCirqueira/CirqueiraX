<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\FrasePronuncia;
use App\Enum\StatusFrasePronuncia;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<FrasePronuncia>
 */
final class FrasePronunciaRepository extends ServiceEntityRepository
{
    private const string CURINGA_LIKE = '%';
    private const string ESPACO = ' ';

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, FrasePronuncia::class);
    }

    public function salvar(FrasePronuncia $frase, bool $flush = true): void
    {
        $this->getEntityManager()->persist($frase);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorUuid(string $uuid): ?FrasePronuncia
    {
        return Uuid::isValid($uuid) ? $this->find(Uuid::fromString($uuid)) : null;
    }

    public function buscarPorHash(string $hash): ?FrasePronuncia
    {
        return $this->findOneBy(['hashOrigem' => $hash]);
    }

    /**
     * @param list<string> $palavras
     *
     * @return list<FrasePronuncia>
     */
    public function listarContendoPalavras(array $palavras, int $limite): array
    {
        if ([] === $palavras) {
            return [];
        }

        $consulta = $this->createQueryBuilder('f')->setMaxResults($limite);
        $condicoes = [];
        foreach (array_values(array_unique($palavras)) as $indice => $palavra) {
            $parametro = 'palavra'.$indice;
            $condicoes[] = 'f.palavrasIndexadas LIKE :'.$parametro;
            $consulta->setParameter($parametro, self::CURINGA_LIKE.self::ESPACO.addcslashes($palavra, '%_\\').self::ESPACO.self::CURINGA_LIKE);
        }
        $consulta->andWhere(implode(' OR ', $condicoes));

        /** @var list<FrasePronuncia> $frases */
        $frases = $consulta->getQuery()->getResult();

        return $frases;
    }

    public function contar(): int
    {
        return $this->count([]);
    }

    public function contarPorStatus(StatusFrasePronuncia $status): int
    {
        return $this->count(['status' => $status]);
    }
}
