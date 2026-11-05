<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\LivroAudio;
use App\Entity\LivroAudioBloco;
use App\Enum\StatusLivroAudioBloco;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<LivroAudioBloco>
 */
class LivroAudioBlocoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LivroAudioBloco::class);
    }

    public function salvar(LivroAudioBloco $bloco, bool $flush = true): void
    {
        $this->getEntityManager()->persist($bloco);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(LivroAudioBloco $bloco, bool $flush = true): void
    {
        $this->getEntityManager()->remove($bloco);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function buscarPorUuid(string $uuid): ?LivroAudioBloco
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->find(Uuid::fromString($uuid));
    }

    public function foiReiniciado(string $uuid): bool
    {
        return StatusLivroAudioBloco::PENDENTE->value === $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT status FROM livro_audio_bloco WHERE uuid = ?',
            [Uuid::fromString($uuid)->toBinary()],
        );
    }

    public function buscarPorLivroENumero(LivroAudio $livro, int $numeroBloco): ?LivroAudioBloco
    {
        return $this->findOneBy([
            'livro' => $livro,
            'numeroBloco' => $numeroBloco,
        ]);
    }

    /**
     * @return list<LivroAudioBloco>
     */
    public function listarPorLivro(LivroAudio $livro): array
    {
        /** @var list<LivroAudioBloco> $blocos */
        $blocos = $this->createQueryBuilder('b')
            ->andWhere('b.livro = :livro')
            ->setParameter('livro', $livro->uuid()->toBinary())
            ->orderBy('b.numeroBloco', 'ASC')
            ->getQuery()
            ->getResult();

        return $blocos;
    }

    /**
     * @return list<LivroAudioBloco>
     */
    public function listarPendentesParaGeracao(int $limite = 10): array
    {
        /** @var list<LivroAudioBloco> $blocos */
        $blocos = $this->createQueryBuilder('b')
            ->andWhere('b.status = :status')
            ->setParameter('status', StatusLivroAudioBloco::PENDENTE)
            ->orderBy('b.criadoEm', 'ASC')
            ->setMaxResults($limite)
            ->getQuery()
            ->getResult();

        return $blocos;
    }

    /**
     * @return list<LivroAudioBloco>
     */
    public function listarNaoProntosDoLivro(LivroAudio $livro): array
    {
        /** @var list<LivroAudioBloco> $blocos */
        $blocos = $this->createQueryBuilder('b')
            ->andWhere('b.livro = :livro')
            ->andWhere('b.status != :statusPronto')
            ->setParameter('livro', $livro->uuid()->toBinary())
            ->setParameter('statusPronto', StatusLivroAudioBloco::PRONTO)
            ->orderBy('b.numeroBloco', 'ASC')
            ->getQuery()
            ->getResult();

        return $blocos;
    }

    public function devolverTravadosParaFila(DateTimeImmutable $limite): int
    {
        return (int) $this->getEntityManager()->getConnection()->executeStatement(
            'UPDATE livro_audio_bloco SET status = ?, atualizado_em = ? WHERE status = ? AND atualizado_em < ?',
            [StatusLivroAudioBloco::PENDENTE->value, (new DateTimeImmutable())->format('Y-m-d H:i:s'), StatusLivroAudioBloco::GERANDO->value, $limite->format('Y-m-d H:i:s')],
        );
    }

    /**
     * @return list<string>
     */
    public function listarCandidatosParaGerar(DateTimeImmutable $escutaRecenteDesde, int $limite = 5): array
    {
        $linhas = $this->getEntityManager()->getConnection()->fetchFirstColumn(
            'SELECT b.uuid FROM livro_audio_bloco b
             INNER JOIN livro_audio l ON l.uuid = b.livro_uuid
             WHERE b.status = ? AND l.fila_pausada = 0
             ORDER BY l.prioridade_fila DESC,
                      (l.ultima_escuta_em IS NOT NULL AND l.ultima_escuta_em >= ?) DESC,
                      l.criado_em ASC,
                      (b.pagina_fim < l.pagina_atual) ASC,
                      b.numero_bloco ASC
             LIMIT ' . max(1, $limite),
            [StatusLivroAudioBloco::PENDENTE->value, $escutaRecenteDesde->format('Y-m-d H:i:s')],
        );

        return array_map(static fn(mixed $binario): string => Uuid::fromBinary((string) $binario)->toRfc4122(), $linhas);
    }

    public function reservarParaGerar(string $uuid): bool
    {
        return 1 === (int) $this->getEntityManager()->getConnection()->executeStatement(
            'UPDATE livro_audio_bloco SET status = ?, erro_motivo = NULL, atualizado_em = ? WHERE uuid = ? AND status = ?',
            [StatusLivroAudioBloco::GERANDO->value, (new DateTimeImmutable())->format('Y-m-d H:i:s'), Uuid::fromString($uuid)->toBinary(), StatusLivroAudioBloco::PENDENTE->value],
        );
    }

    public function contarPendentesAtivos(): int
    {
        return (int) $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT COUNT(*) FROM livro_audio_bloco b INNER JOIN livro_audio l ON l.uuid = b.livro_uuid WHERE b.status = ? AND l.fila_pausada = 0',
            [StatusLivroAudioBloco::PENDENTE->value],
        );
    }

    /**
     * @return array<string, array{pendentes: int, gerando: int, prontos: int, erros: int, total: int}>
     */
    public function contarStatusPorLivro(): array
    {
        $linhas = $this->getEntityManager()->getConnection()->fetchAllAssociative(
            'SELECT livro_uuid, status, COUNT(*) AS total FROM livro_audio_bloco GROUP BY livro_uuid, status',
        );

        $resumo = [];
        foreach ($linhas as $linha) {
            $chave = Uuid::fromBinary((string) $linha['livro_uuid'])->toRfc4122();
            $resumo[$chave] ??= ['pendentes' => 0, 'gerando' => 0, 'prontos' => 0, 'erros' => 0, 'total' => 0];
            $quantidade = (int) $linha['total'];
            $campo = match ((string) $linha['status']) {
                StatusLivroAudioBloco::PENDENTE->value => 'pendentes',
                StatusLivroAudioBloco::GERANDO->value => 'gerando',
                StatusLivroAudioBloco::PRONTO->value => 'prontos',
                default => 'erros',
            };
            $resumo[$chave][$campo] += $quantidade;
            $resumo[$chave]['total'] += $quantidade;
        }

        return $resumo;
    }

    public function mediaSegundosGeracaoRecente(): ?float
    {
        $valor = $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT AVG(intervalo) FROM (
                SELECT TIMESTAMPDIFF(SECOND, LAG(atualizado_em) OVER (ORDER BY atualizado_em), atualizado_em) AS intervalo
                FROM livro_audio_bloco WHERE status = ? AND atualizado_em >= ?
             ) intervalos WHERE intervalo BETWEEN 5 AND 600',
            [StatusLivroAudioBloco::PRONTO->value, (new DateTimeImmutable('-1 day'))->format('Y-m-d H:i:s')],
        );

        return is_numeric($valor) ? (float) $valor : null;
    }

    /**
     * @return array{partes: int, prontas: int, bytes: int, segundos: int}
     */
    public function resumoAudiosPrincipais(): array
    {
        $linha = $this->getEntityManager()->getConnection()->fetchAssociative(
            'SELECT COUNT(*) AS partes, COALESCE(SUM(status = ?), 0) AS prontas, COALESCE(SUM(tamanho_bytes), 0) AS bytes, COALESCE(SUM(duracao_segundos), 0) AS segundos FROM livro_audio_bloco',
            [StatusLivroAudioBloco::PRONTO->value],
        ) ?: [];

        return [
            'partes' => (int) ($linha['partes'] ?? 0),
            'prontas' => (int) ($linha['prontas'] ?? 0),
            'bytes' => (int) ($linha['bytes'] ?? 0),
            'segundos' => (int) ($linha['segundos'] ?? 0),
        ];
    }

    public function mediaBytesPorParte(): ?float
    {
        $valor = $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT AVG(tamanho_bytes) FROM livro_audio_bloco WHERE status = ? AND tamanho_bytes > 0',
            [StatusLivroAudioBloco::PRONTO->value],
        );

        return is_numeric($valor) ? (float) $valor : null;
    }

    /**
     * @return list<string>
     */
    public function listarUuidsPendentesDoLivro(LivroAudio $livro): array
    {
        return array_map(
            static fn(mixed $binario): string => Uuid::fromBinary((string) $binario)->toRfc4122(),
            $this->getEntityManager()->getConnection()->fetchFirstColumn(
                'SELECT uuid FROM livro_audio_bloco WHERE livro_uuid = ? AND status = ? ORDER BY numero_bloco',
                [$livro->uuid()->toBinary(), StatusLivroAudioBloco::PENDENTE->value],
            ),
        );
    }
}
