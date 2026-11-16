<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\LivroAudio;
use App\Entity\LivroAudioBloco;
use App\Entity\LivroAudioBlocoVoz;
use App\Entity\Usuario;
use App\Enum\StatusLivroAudioBloco;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<LivroAudioBlocoVoz>
 */
class LivroAudioBlocoVozRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LivroAudioBlocoVoz::class);
    }

    public function salvar(LivroAudioBlocoVoz $blocoVoz, bool $flush = true): void
    {
        $this->getEntityManager()->persist($blocoVoz);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(LivroAudioBlocoVoz $blocoVoz, bool $flush = true): void
    {
        $this->getEntityManager()->remove($blocoVoz);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorUuid(string $uuid): ?LivroAudioBlocoVoz
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->find(Uuid::fromString($uuid));
    }

    public function existe(string $uuid): bool
    {
        return false !== $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT 1 FROM livro_audio_bloco_voz WHERE uuid = ?',
            [Uuid::fromString($uuid)->toBinary()],
        );
    }

    public function foiReiniciado(string $uuid): bool
    {
        return StatusLivroAudioBloco::PENDENTE->value === $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT status FROM livro_audio_bloco_voz WHERE uuid = ?',
            [Uuid::fromString($uuid)->toBinary()],
        );
    }

    public function buscarPorBlocoEVoz(LivroAudioBloco $bloco, string $voz): ?LivroAudioBlocoVoz
    {
        return $this->findOneBy([
            'bloco' => $bloco,
            'voz' => $voz,
        ]);
    }

    /**
     * @return list<LivroAudioBlocoVoz>
     */
    public function listarPorLivro(LivroAudio $livro, ?string $voz = null): array
    {
        $consulta = $this->createQueryBuilder('v')
            ->innerJoin('v.bloco', 'b')
            ->andWhere('b.livro = :livro')
            ->setParameter('livro', $livro->uuid()->toBinary())
            ->orderBy('b.numeroBloco', 'ASC');

        if (null !== $voz) {
            $consulta->andWhere('v.voz = :voz')->setParameter('voz', $voz);
        }

        /** @var list<LivroAudioBlocoVoz> $vozes */
        $vozes = $consulta->getQuery()->getResult();

        return $vozes;
    }

    /**
     * @return list<array{voz: string, partes: int, bytes: int, segundos: int}>
     */
    public function resumoPorVoz(?Usuario $usuario = null): array
    {
        $sql = 'SELECT v.voz AS voz, COUNT(*) AS partes, COALESCE(SUM(v.tamanho_bytes), 0) AS bytes, COALESCE(SUM(v.duracao_segundos), 0) AS segundos FROM livro_audio_bloco_voz v';
        $params = [StatusLivroAudioBloco::PRONTO->value];
        if (null !== $usuario) {
            $sql .= ' INNER JOIN livro_audio_bloco b ON b.uuid = v.bloco_uuid INNER JOIN livro_audio l ON l.uuid = b.livro_uuid WHERE v.status = ? AND l.usuario_id = ?';
            $params[] = $usuario->getId();
        } else {
            $sql .= ' WHERE v.status = ?';
        }
        $sql .= ' GROUP BY v.voz ORDER BY bytes DESC';

        $linhas = $this->getEntityManager()->getConnection()->fetchAllAssociative($sql, $params);

        return array_map(static fn(array $linha): array => [
            'voz' => (string) $linha['voz'],
            'partes' => (int) $linha['partes'],
            'bytes' => (int) $linha['bytes'],
            'segundos' => (int) $linha['segundos'],
        ], $linhas);
    }
}
