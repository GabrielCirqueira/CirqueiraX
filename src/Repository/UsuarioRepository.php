<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Security\User\UserLoaderInterface;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * @extends ServiceEntityRepository<Usuario>
 */
class UsuarioRepository extends ServiceEntityRepository implements PasswordUpgraderInterface, UserLoaderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Usuario::class);
    }

    public function salvar(Usuario $usuario, bool $flush = true): void
    {
        $this->getEntityManager()->persist($usuario);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function usernameJaExiste(string $username): bool
    {
        return $this->count(['username' => $username]) > 0;
    }

    public function emailJaExiste(string $email): bool
    {
        return $this->count(['email' => $email]) > 0;
    }

    public function buscarPorEmail(string $email): ?Usuario
    {
        return $this->findOneBy(['email' => $email]);
    }

    public function buscarPorUsername(string $username): ?Usuario
    {
        return $this->findOneBy(['username' => $username]);
    }

    public function loadUserByIdentifier(string $identifier): ?UserInterface
    {
        return $this->createQueryBuilder('u')
            ->where('u.email = :identifier OR u.username = :identifier')
            ->setParameter('identifier', $identifier)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof Usuario) {
            throw new UnsupportedUserException(sprintf('Instâncias de "%s" não são suportadas.', $user::class));
        }
        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->flush();
    }
}
