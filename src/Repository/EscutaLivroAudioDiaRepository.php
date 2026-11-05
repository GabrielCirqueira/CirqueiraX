<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\EscutaLivroAudioDia;
use App\Entity\LivroAudio;
use App\Entity\Usuario;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<EscutaLivroAudioDia>
 */
class EscutaLivroAudioDiaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EscutaLivroAudioDia::class);
    }

    public function somar(LivroAudio $livro, DateTimeImmutable $dia, int $segundos): void
    {
        $agora = (new DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->getEntityManager()->getConnection()->executeStatement(
            'INSERT INTO escuta_livro_audio_dia (uuid, usuario_id, livro_uuid, dia, segundos, atualizado_em)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE segundos = segundos + VALUES(segundos), atualizado_em = VALUES(atualizado_em)',
            [
                Uuid::v7()->toBinary(),
                $livro->usuario()->getId(),
                $livro->uuid()->toBinary(),
                $dia->format('Y-m-d'),
                max(0, $segundos),
                $agora,
            ],
        );
    }

    /**
     * @return array<string, int>
     */
    public function segundosPorDia(Usuario $usuario, DateTimeImmutable $desde): array
    {
        $linhas = $this->getEntityManager()->getConnection()->fetchAllKeyValue(
            'SELECT dia, SUM(segundos) FROM escuta_livro_audio_dia WHERE usuario_id = ? AND dia >= ? GROUP BY dia ORDER BY dia',
            [$usuario->getId(), $desde->format('Y-m-d')],
        );

        return array_map('intval', $linhas);
    }

    public function totalSegundos(Usuario $usuario): int
    {
        return (int) $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT COALESCE(SUM(segundos), 0) FROM escuta_livro_audio_dia WHERE usuario_id = ?',
            [$usuario->getId()],
        );
    }

    /**
     * @return list<string>
     */
    public function diasComEscuta(Usuario $usuario, int $segundosMinimos, DateTimeImmutable $desde): array
    {
        return array_map('strval', $this->getEntityManager()->getConnection()->fetchFirstColumn(
            'SELECT dia FROM escuta_livro_audio_dia WHERE usuario_id = ? AND dia >= ? GROUP BY dia HAVING SUM(segundos) >= ? ORDER BY dia DESC',
            [$usuario->getId(), $desde->format('Y-m-d'), $segundosMinimos],
        ));
    }
}
