<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\LivroAudio;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<LivroAudio>
 */
class LivroAudioRepository extends ServiceEntityRepository
{
    private const string FILA_GERACAO = 'livro_audio';

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LivroAudio::class);
    }

    public function salvar(LivroAudio $livroAudio, bool $flush = true): void
    {
        $this->getEntityManager()->persist($livroAudio);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(LivroAudio $livroAudio, bool $flush = true): void
    {
        $this->getEntityManager()->remove($livroAudio);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function existe(string $uuid): bool
    {
        return false !== $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT 1 FROM livro_audio WHERE uuid = ?',
            [Uuid::fromString($uuid)->toBinary()],
        );
    }

    /**
     * @return list<LivroAudio>
     */
    public function listarPorEnvio(): array
    {
        return $this->findBy([], ['criadoEm' => 'ASC']);
    }

    public function limparFilaDeGeracao(): void
    {
        $this->getEntityManager()->getConnection()->executeStatement(
            'DELETE FROM messenger_messages WHERE queue_name = ?',
            [self::FILA_GERACAO],
        );
    }

    public function contarMensagensNaFila(): int
    {
        return (int) $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT COUNT(*) FROM messenger_messages WHERE queue_name = ? AND delivered_at IS NULL',
            [self::FILA_GERACAO],
        );
    }

    public function maiorPrioridadeFila(Usuario $usuario): int
    {
        return (int) $this->createQueryBuilder('l')
            ->select('COALESCE(MAX(l.prioridadeFila), 0)')
            ->andWhere('l.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return array{livros: int, pdfs: int, bytesPdfs: int, porStatus: array<string, int>}
     */
    public function resumoArmazenamento(): array
    {
        $conexao = $this->getEntityManager()->getConnection();
        $totais = $conexao->fetchAssociative(
            'SELECT COUNT(*) AS livros, COALESCE(SUM(caminho_pdf IS NOT NULL), 0) AS pdfs, COALESCE(SUM(tamanho_bytes), 0) AS bytes_pdfs FROM livro_audio',
        ) ?: [];

        return [
            'livros' => (int) ($totais['livros'] ?? 0),
            'pdfs' => (int) ($totais['pdfs'] ?? 0),
            'bytesPdfs' => (int) ($totais['bytes_pdfs'] ?? 0),
            'porStatus' => array_map('intval', $conexao->fetchAllKeyValue('SELECT status, COUNT(*) FROM livro_audio GROUP BY status')),
        ];
    }

    public function buscarPorUuid(string $uuid): ?LivroAudio
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->find(Uuid::fromString($uuid));
    }

    public function buscarDoUsuario(string $uuid, Usuario $usuario): ?LivroAudio
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->findOneBy(['uuid' => Uuid::fromString($uuid), 'usuario' => $usuario]);
    }

    /**
     * @return list<LivroAudio>
     */
    public function listarDoUsuario(Usuario $usuario): array
    {
        /** @var list<LivroAudio> $livros */
        $livros = $this->createQueryBuilder('l')
            ->andWhere('l.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->orderBy('l.criadoEm', 'DESC')
            ->getQuery()
            ->getResult();

        return $livros;
    }
}
