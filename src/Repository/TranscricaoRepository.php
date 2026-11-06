<?php

declare(strict_types=1);

namespace App\Repository;

use App\DataObject\Transcricao\FiltroTranscricoesDTO;
use App\DataObject\Transcricao\PaginaTranscricoesDTO;
use App\DataObject\Transcricao\ResumoTranscricoesDTO;
use App\Entity\Transcricao;
use App\Entity\Usuario;
use App\Enum\StatusTranscricao;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<Transcricao>
 */
class TranscricaoRepository extends ServiceEntityRepository
{
    private const string CARACTERES_CURINGA_LIKE = '%';

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Transcricao::class);
    }

    public function salvar(Transcricao $transcricao, bool $flush = true): void
    {
        $this->getEntityManager()->persist($transcricao);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remover(Transcricao $transcricao): void
    {
        $this->getEntityManager()->remove($transcricao);
        $this->getEntityManager()->flush();
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function recarregar(Transcricao $transcricao): void
    {
        $this->getEntityManager()->refresh($transcricao);
    }

    public function buscarPorUuid(string $uuid): ?Transcricao
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->find(Uuid::fromString($uuid));
    }

    public function buscarDoUsuario(string $uuid, Usuario $usuario): ?Transcricao
    {
        if (!Uuid::isValid($uuid)) {
            return null;
        }

        return $this->findOneBy(['uuid' => Uuid::fromString($uuid), 'usuario' => $usuario]);
    }

    public function paginarDoUsuario(Usuario $usuario, FiltroTranscricoesDTO $filtro): PaginaTranscricoesDTO
    {
        $consulta = $this->montarConsultaFiltrada($usuario, $filtro);

        $total = (int) (clone $consulta)
            ->select('COUNT(t.uuid)')
            ->getQuery()
            ->getSingleScalarResult();

        /** @var list<Transcricao> $transcricoes */
        $transcricoes = $consulta
            ->orderBy('t.criadoEm', 'DESC')
            ->setFirstResult(($filtro->pagina() - 1) * $filtro->limite())
            ->setMaxResults($filtro->limite())
            ->getQuery()
            ->getResult();

        return new PaginaTranscricoesDTO($transcricoes, $total);
    }

    public function calcularResumoDoUsuario(Usuario $usuario): ResumoTranscricoesDTO
    {
        $sql = '
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(CASE WHEN t.status = :concluida THEN 1 ELSE 0 END), 0) AS concluidas,
                COALESCE(SUM(CASE WHEN t.status = :naFila THEN 1 ELSE 0 END), 0) AS na_fila,
                COALESCE(SUM(CASE WHEN t.status = :transcrevendo THEN 1 ELSE 0 END), 0) AS transcrevendo,
                COALESCE(SUM(CASE WHEN t.status = :erro THEN 1 ELSE 0 END), 0) AS com_erro,
                COALESCE(SUM(CASE WHEN t.favorita = 1 THEN 1 ELSE 0 END), 0) AS favoritas,
                COALESCE(SUM(CASE WHEN t.status = :concluida THEN t.duracao_segundos ELSE 0 END), 0) AS segundos_transcritos,
                COALESCE(SUM(t.total_palavras), 0) AS total_palavras,
                COALESCE(SUM(CASE
                    WHEN t.status IN (:naFila, :transcrevendo)
                    THEN COALESCE(t.duracao_segundos, 0) * :fator * (1 - t.progresso / 100)
                    ELSE 0
                END), 0) AS segundos_restantes
            FROM transcricao t
            WHERE t.usuario_id = :usuarioId
        ';

        /** @var array<string, int|string|float|null> $linha */
        $linha = $this->getEntityManager()->getConnection()->executeQuery($sql, [
            'usuarioId' => $usuario->getId(),
            'concluida' => StatusTranscricao::CONCLUIDA->value,
            'naFila' => StatusTranscricao::NA_FILA->value,
            'transcrevendo' => StatusTranscricao::TRANSCREVENDO->value,
            'erro' => StatusTranscricao::ERRO->value,
            'fator' => Transcricao::FATOR_TEMPO_PROCESSAMENTO,
        ])->fetchAssociative();

        return new ResumoTranscricoesDTO(
            total: (int) ($linha['total'] ?? 0),
            concluidas: (int) ($linha['concluidas'] ?? 0),
            naFila: (int) ($linha['na_fila'] ?? 0),
            transcrevendo: (int) ($linha['transcrevendo'] ?? 0),
            comErro: (int) ($linha['com_erro'] ?? 0),
            favoritas: (int) ($linha['favoritas'] ?? 0),
            segundosTranscritos: (float) ($linha['segundos_transcritos'] ?? 0),
            totalPalavras: (int) ($linha['total_palavras'] ?? 0),
            segundosRestantesEstimados: (int) ceil((float) ($linha['segundos_restantes'] ?? 0)),
        );
    }

    /**
     * @return list<Transcricao>
     */
    public function buscarComAudioCriadasAntesDe(DateTimeImmutable $limite): array
    {
        /** @var list<Transcricao> $resultado */
        $resultado = $this->createQueryBuilder('t')
            ->andWhere('t.caminhoArquivo IS NOT NULL')
            ->andWhere('t.criadoEm < :limite')
            ->andWhere('t.status NOT IN (:emAndamento)')
            ->setParameter('limite', $limite)
            ->setParameter('emAndamento', [StatusTranscricao::NA_FILA, StatusTranscricao::TRANSCREVENDO])
            ->getQuery()
            ->getResult();

        return $resultado;
    }

    /**
     * @return list<Transcricao>
     */
    public function buscarTranscrevendoAtualizadasAntesDe(DateTimeImmutable $limite): array
    {
        /** @var list<Transcricao> $resultado */
        $resultado = $this->createQueryBuilder('t')
            ->andWhere('t.status = :transcrevendo')
            ->andWhere('t.atualizadoEm < :limite')
            ->setParameter('transcrevendo', StatusTranscricao::TRANSCREVENDO)
            ->setParameter('limite', $limite)
            ->getQuery()
            ->getResult();

        return $resultado;
    }

    private function montarConsultaFiltrada(Usuario $usuario, FiltroTranscricoesDTO $filtro): QueryBuilder
    {
        $consulta = $this->createQueryBuilder('t')
            ->andWhere('t.usuario = :usuario')
            ->setParameter('usuario', $usuario);

        $status = $filtro->filtro()->statusIncluidos();
        if ([] !== $status) {
            $consulta->andWhere('t.status IN (:status)')->setParameter('status', $status);
        }

        if ($filtro->filtro()->isApenasFavoritas()) {
            $consulta->andWhere('t.favorita = true');
        }

        $busca = $filtro->busca();
        if (null !== $busca) {
            $consulta
                ->andWhere('LOWER(t.titulo) LIKE :busca OR LOWER(t.texto) LIKE :busca OR LOWER(t.nomeArquivoOriginal) LIKE :busca')
                ->setParameter('busca', $this->montarTermoLike($busca));
        }

        return $consulta;
    }

    private function montarTermoLike(string $busca): string
    {
        $termoEscapado = addcslashes(mb_strtolower($busca), '%_\\');

        return self::CARACTERES_CURINGA_LIKE . $termoEscapado . self::CARACTERES_CURINGA_LIKE;
    }
}
