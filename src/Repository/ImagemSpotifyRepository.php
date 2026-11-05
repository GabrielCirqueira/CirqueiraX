<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ImagemSpotify;
use App\Enum\StatusImagemSpotify;
use App\Enum\TipoImagemSpotify;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<ImagemSpotify>
 */
final class ImagemSpotifyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ImagemSpotify::class);
    }

    public function salvar(ImagemSpotify $imagem, bool $flush = true): void
    {
        $this->getEntityManager()->persist($imagem);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(ImagemSpotify $imagem, bool $flush = true): void
    {
        $this->getEntityManager()->remove($imagem);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorId(string $id): ?ImagemSpotify
    {
        if (!Uuid::isValid($id)) {
            return null;
        }

        return $this->find(Uuid::fromString($id));
    }

    public function buscarPorChaveBusca(string $chaveBusca): ?ImagemSpotify
    {
        /** @var ImagemSpotify|null $resultado */
        $resultado = $this->createQueryBuilder('i')
            ->andWhere('i.chaveBusca = :chave')
            ->setParameter('chave', $chaveBusca)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }

    public function buscarPorCodigo(TipoImagemSpotify $tipo, string $codigo): ?ImagemSpotify
    {
        /** @var ImagemSpotify|null $resultado */
        $resultado = $this->createQueryBuilder('i')
            ->andWhere('i.tipo = :tipo')
            ->andWhere('i.codigoSpotify = :codigo')
            ->setParameter('tipo', $tipo)
            ->setParameter('codigo', $codigo)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }

    /**
     * @param array<int, string> $chaves
     * @return array<string, ImagemSpotify>
     */
    public function buscarMapeamentoPorChaves(array $chaves): array
    {
        if (empty($chaves)) {
            return [];
        }

        /** @var array<int, ImagemSpotify> $resultados */
        $resultados = $this->createQueryBuilder('i')
            ->andWhere('i.chaveBusca IN (:chaves)')
            ->setParameter('chaves', array_values(array_unique($chaves)))
            ->getQuery()
            ->getResult();

        $mapa = [];
        foreach ($resultados as $imagem) {
            $mapa[$imagem->chaveBusca()] = $imagem;
        }

        return $mapa;
    }

    /**
     * @param array<int, string> $codigos
     * @return array<string, ImagemSpotify>
     */
    public function buscarMapeamentoPorCodigos(TipoImagemSpotify $tipo, array $codigos): array
    {
        if (empty($codigos)) {
            return [];
        }

        /** @var array<int, ImagemSpotify> $resultados */
        $resultados = $this->createQueryBuilder('i')
            ->andWhere('i.tipo = :tipo')
            ->andWhere('i.codigoSpotify IN (:codigos)')
            ->setParameter('tipo', $tipo)
            ->setParameter('codigos', array_values(array_unique($codigos)))
            ->getQuery()
            ->getResult();

        $mapa = [];
        foreach ($resultados as $imagem) {
            if ($imagem->codigoSpotify() !== null) {
                $mapa[$imagem->codigoSpotify()] = $imagem;
            }
        }

        return $mapa;
    }

    /**
     * @return array<int, ImagemSpotify>
     */
    public function buscarPendentesParaProcessamento(int $limite = 20): array
    {
        /** @var array<int, ImagemSpotify> $resultados */
        $resultados = $this->createQueryBuilder('i')
            ->andWhere('i.status = :status')
            ->setParameter('status', StatusImagemSpotify::Pendente)
            ->orderBy('i.tentativas', 'ASC')
            ->addOrderBy('i.criadoEm', 'ASC')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $resultados;
    }
}

