<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Enum\OrigemClassificacao;
use App\Enum\StatusClassificacaoVideo;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<VideoYoutube>
 */
final class VideoYoutubeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VideoYoutube::class);
    }

    public function salvar(VideoYoutube $video, bool $flush = true): void
    {
        $this->getEntityManager()->persist($video);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(VideoYoutube $video, bool $flush = true): void
    {
        $this->getEntityManager()->remove($video);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorVideoId(Usuario $usuario, string $videoId): ?VideoYoutube
    {
        /** @var VideoYoutube|null $resultado */
        $resultado = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.videoId = :videoId')
            ->setParameter('usuario', $usuario)
            ->setParameter('videoId', $videoId)
            ->getQuery()
            ->getOneOrNullResult();

        return $resultado;
    }

    /**
     * @param list<string> $videoIds
     *
     * @return array<string, VideoYoutube>
     */
    public function buscarPorVideoIds(Usuario $usuario, array $videoIds): array
    {
        if ([] === $videoIds) {
            return [];
        }

        /** @var list<VideoYoutube> $videos */
        $videos = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.videoId IN (:videoIds)')
            ->setParameter('usuario', $usuario)
            ->setParameter('videoIds', array_values(array_unique($videoIds)))
            ->getQuery()
            ->getResult();

        $mapa = [];
        foreach ($videos as $video) {
            $mapa[$video->videoId()] = $video;
        }

        return $mapa;
    }

    /**
     * @return list<VideoYoutube>
     */
    public function listarPendentes(Usuario $usuario, int $limite): array
    {
        /** @var list<VideoYoutube> $videos */
        $videos = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.status = :status')
            ->setParameter('usuario', $usuario)
            ->setParameter('status', StatusClassificacaoVideo::Pendente)
            ->orderBy('e.criadoEm', 'ASC')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $videos;
    }

    /**
     * @return list<VideoYoutube>
     */
    public function listarDoCanal(Usuario $usuario, string $canal): array
    {
        /** @var list<VideoYoutube> $videos */
        $videos = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.canal = :canal')
            ->setParameter('usuario', $usuario)
            ->setParameter('canal', $canal)
            ->getQuery()
            ->getResult();

        return $videos;
    }

    /**
     * @return list<VideoYoutube>
     */
    public function listarComDetalhesVencidos(DateTimeImmutable $atualizadosAntesDe, int $limite): array
    {
        /** @var list<VideoYoutube> $videos */
        $videos = $this->createQueryBuilder('e')
            ->andWhere('e.detalhesAtualizadosEm IS NULL OR e.detalhesAtualizadosEm < :limite')
            ->setParameter('limite', $atualizadosAntesDe)
            ->orderBy('e.detalhesAtualizadosEm', 'ASC')
            ->addOrderBy('e.criadoEm', 'ASC')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $videos;
    }

    /**
     * @return list<VideoYoutube>
     */
    public function listarPendentesDeTodos(int $limite): array
    {
        /** @var list<VideoYoutube> $videos */
        $videos = $this->createQueryBuilder('e')
            ->andWhere('e.status = :status')
            ->setParameter('status', StatusClassificacaoVideo::Pendente)
            ->orderBy('e.criadoEm', 'ASC')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $videos;
    }

    /**
     * @return list<VideoYoutube>
     */
    public function listarParaReidentificar(Usuario $usuario, int $limite): array
    {
        /** @var list<VideoYoutube> $videos */
        $videos = $this->createQueryBuilder('e')
            ->andWhere('e.usuario = :usuario')
            ->andWhere('e.origemClassificacao IS NULL OR e.origemClassificacao != :manual')
            ->andWhere('e.status != :indisponivel')
            ->setParameter('usuario', $usuario)
            ->setParameter('manual', OrigemClassificacao::Manual)
            ->setParameter('indisponivel', StatusClassificacaoVideo::Indisponivel)
            ->orderBy('e.classificadoEm', 'ASC')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $videos;
    }
}
