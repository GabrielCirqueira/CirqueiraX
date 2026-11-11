<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\CotaYoutubeDataDia;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<CotaYoutubeDataDia>
 */
final class CotaYoutubeDataDiaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CotaYoutubeDataDia::class);
    }

    public function somarUnidades(string $dia, int $unidades): void
    {
        $this->getEntityManager()->getConnection()->executeStatement(
            'INSERT INTO cota_youtube_data_dia (uuid, dia, unidades_usadas) VALUES (:uuid, :dia, :unidades)
            ON DUPLICATE KEY UPDATE unidades_usadas = unidades_usadas + :unidades',
            ['uuid' => Uuid::v7()->toBinary(), 'dia' => $dia, 'unidades' => $unidades],
        );
    }

    public function marcarExcedida(string $dia, string $momento): void
    {
        $this->getEntityManager()->getConnection()->executeStatement(
            'INSERT INTO cota_youtube_data_dia (uuid, dia, unidades_usadas, excedida_em) VALUES (:uuid, :dia, 0, :momento)
            ON DUPLICATE KEY UPDATE excedida_em = :momento',
            ['uuid' => Uuid::v7()->toBinary(), 'dia' => $dia, 'momento' => $momento],
        );
    }

    /**
     * @return array{unidadesUsadas: int, excedida: bool}
     */
    public function obterDoDia(string $dia): array
    {
        $linha = $this->getEntityManager()->getConnection()->fetchAssociative(
            'SELECT unidades_usadas, excedida_em FROM cota_youtube_data_dia WHERE dia = :dia',
            ['dia' => $dia],
        );

        if (false === $linha) {
            return ['unidadesUsadas' => 0, 'excedida' => false];
        }

        return ['unidadesUsadas' => (int) $linha['unidades_usadas'], 'excedida' => null !== $linha['excedida_em']];
    }
}
