<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ConsultaSpotifyHora;
use App\Enum\OrigemConsultaSpotify;
use DateTimeImmutable;
use DateTimeZone;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<ConsultaSpotifyHora>
 */
final class ConsultaSpotifyHoraRepository extends ServiceEntityRepository
{
    private const string FORMATO_HORA = 'Y-m-d H:00:00';
    private const string FUSO_UTC = 'UTC';

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ConsultaSpotifyHora::class);
    }

    public function incrementar(OrigemConsultaSpotify $origem, DateTimeImmutable $momento): void
    {
        $this->getEntityManager()->getConnection()->executeStatement(
            'INSERT INTO consulta_spotify_hora (uuid, hora, origem, total) VALUES (:uuid, :hora, :origem, 1)
            ON DUPLICATE KEY UPDATE total = total + 1',
            [
                'uuid' => Uuid::v7()->toBinary(),
                'hora' => $this->emUtc($momento)->format(self::FORMATO_HORA),
                'origem' => $origem->value,
            ],
        );
    }

    public function somarDaOrigemDesde(OrigemConsultaSpotify $origem, DateTimeImmutable $desde): int
    {
        $total = $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT COALESCE(SUM(total), 0) FROM consulta_spotify_hora WHERE origem = :origem AND hora >= :desde',
            [
                'origem' => $origem->value,
                'desde' => $this->emUtc($desde)->format(self::FORMATO_HORA),
            ],
        );

        return (int) $total;
    }

    /**
     * @return array<string, int>
     */
    public function somarPorOrigemDesde(DateTimeImmutable $desde): array
    {
        $linhas = $this->getEntityManager()->getConnection()->fetchAllKeyValue(
            'SELECT origem, SUM(total) FROM consulta_spotify_hora WHERE hora >= :desde GROUP BY origem ORDER BY origem',
            ['desde' => $this->emUtc($desde)->format(self::FORMATO_HORA)],
        );

        return array_map('intval', $linhas);
    }

    private function emUtc(DateTimeImmutable $momento): DateTimeImmutable
    {
        return $momento->setTimezone(new DateTimeZone(self::FUSO_UTC));
    }
}
