<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\MusicaCatalogo;
use App\Entity\Usuario;
use App\Entity\VinculoMusicaSpotify;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<VinculoMusicaSpotify>
 */
final class VinculoMusicaSpotifyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VinculoMusicaSpotify::class);
    }

    public function salvar(VinculoMusicaSpotify $vinculo, bool $flush = true): void
    {
        $this->getEntityManager()->persist($vinculo);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(VinculoMusicaSpotify $vinculo, bool $flush = true): void
    {
        $this->getEntityManager()->remove($vinculo);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorIdentidade(Usuario $usuario, string $nomeNormalizado, string $artistaNormalizado): ?VinculoMusicaSpotify
    {
        /** @var VinculoMusicaSpotify|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.nomeNormalizado = :nomeNormalizado')
            ->andWhere('e.artistaNormalizado = :artistaNormalizado')
            ->setParameter('usuario', $usuario)
            ->setParameter('nomeNormalizado', $nomeNormalizado)
            ->setParameter('artistaNormalizado', $artistaNormalizado)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }

    /**
     * @return array<string, true>
     */
    public function listarIdentidadesDoUsuario(Usuario $usuario): array
    {
        $linhas = $this->getEntityManager()->getConnection()->executeQuery(
            'SELECT nome_normalizado, artista_normalizado FROM vinculo_musica_spotify WHERE usuario_id = :usuarioId',
            ['usuarioId' => $usuario->getId()],
        )->fetchAllAssociative();

        $identidades = [];
        foreach ($linhas as $linha) {
            $identidades[$linha['nome_normalizado'].'|'.$linha['artista_normalizado']] = true;
        }

        return $identidades;
    }

    /**
     * @return list<VinculoMusicaSpotify>
     */
    public function listarDaMusica(MusicaCatalogo $musica): array
    {
        /** @var list<VinculoMusicaSpotify> $vinculos */
        $vinculos = $this->findBy(['musica' => $musica]);

        return $vinculos;
    }
}
