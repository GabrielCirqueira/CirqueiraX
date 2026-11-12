<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\TokenExtensaoYoutubeMusic;
use App\Entity\Usuario;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<TokenExtensaoYoutubeMusic>
 */
final class TokenExtensaoYoutubeMusicRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TokenExtensaoYoutubeMusic::class);
    }

    public function salvar(TokenExtensaoYoutubeMusic $token, bool $flush = true): void
    {
        $this->getEntityManager()->persist($token);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function buscarAtivoPorHash(string $hash): ?TokenExtensaoYoutubeMusic
    {
        /** @var TokenExtensaoYoutubeMusic|null $token */
        $token = $this->createQueryBuilder('t')
            ->andWhere('t.tokenHash = :hash')
            ->andWhere('t.revogadoEm IS NULL')
            ->setParameter('hash', $hash)
            ->getQuery()
            ->getOneOrNullResult();

        return $token;
    }

    public function buscarAtivoDoUsuario(Usuario $usuario, Uuid $uuid): ?TokenExtensaoYoutubeMusic
    {
        /** @var TokenExtensaoYoutubeMusic|null $token */
        $token = $this->createQueryBuilder('t')
            ->andWhere('t.usuario = :usuario')
            ->andWhere('t.uuid = :uuid')
            ->andWhere('t.revogadoEm IS NULL')
            ->setParameter('usuario', $usuario)
            ->setParameter('uuid', $uuid, UuidType::NAME)
            ->getQuery()
            ->getOneOrNullResult();

        return $token;
    }

    /**
     * @return list<TokenExtensaoYoutubeMusic>
     */
    public function listarAtivosDoUsuario(Usuario $usuario): array
    {
        /** @var list<TokenExtensaoYoutubeMusic> $tokens */
        $tokens = $this->createQueryBuilder('t')
            ->andWhere('t.usuario = :usuario')
            ->andWhere('t.revogadoEm IS NULL')
            ->setParameter('usuario', $usuario)
            ->orderBy('t.criadoEm', 'DESC')
            ->getQuery()
            ->getResult();

        return $tokens;
    }

    public function contarAtivosDoUsuario(Usuario $usuario): int
    {
        return (int) $this->createQueryBuilder('t')
            ->select('COUNT(t.uuid)')
            ->andWhere('t.usuario = :usuario')
            ->andWhere('t.revogadoEm IS NULL')
            ->setParameter('usuario', $usuario)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function buscarUltimoUsoDoUsuario(Usuario $usuario): ?DateTimeImmutable
    {
        $valor = $this->createQueryBuilder('t')
            ->select('MAX(t.ultimoUsoEm)')
            ->andWhere('t.usuario = :usuario')
            ->andWhere('t.revogadoEm IS NULL')
            ->setParameter('usuario', $usuario)
            ->getQuery()
            ->getSingleScalarResult();

        return is_string($valor) ? new DateTimeImmutable($valor) : null;
    }
}
