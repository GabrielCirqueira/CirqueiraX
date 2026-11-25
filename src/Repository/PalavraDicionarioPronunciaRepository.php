<?php

declare(strict_types=1);

namespace App\Repository;

use App\Domain\Pronuncia\FonemasIngles;
use App\Entity\PalavraDicionarioPronuncia;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<PalavraDicionarioPronuncia>
 */
final class PalavraDicionarioPronunciaRepository extends ServiceEntityRepository
{
    private const int TAMANHO_LOTE_CONSULTA = 1000;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PalavraDicionarioPronuncia::class);
    }

    /**
     * @param list<string> $palavras
     *
     * @return array<string, list<list<string>>>
     */
    public function buscarVariantesPorPalavras(array $palavras): array
    {
        $mapa = [];
        foreach (array_chunk(array_values(array_unique($palavras)), self::TAMANHO_LOTE_CONSULTA) as $lote) {
            $linhas = $this->getEntityManager()->getConnection()->fetchAllAssociative(
                'SELECT palavra, fonemas FROM palavra_dicionario_pronuncia WHERE palavra IN (:palavras) ORDER BY palavra, variante',
                ['palavras' => $lote],
                ['palavras' => ArrayParameterType::STRING],
            );

            foreach ($linhas as $linha) {
                $mapa[(string) $linha['palavra']][] = FonemasIngles::separar((string) $linha['fonemas']);
            }
        }

        return $mapa;
    }

    public function contar(): int
    {
        return (int) $this->getEntityManager()->getConnection()->fetchOne('SELECT COUNT(*) FROM palavra_dicionario_pronuncia');
    }

    public function apagarTudo(): void
    {
        $this->getEntityManager()->getConnection()->executeStatement('DELETE FROM palavra_dicionario_pronuncia');
    }

    /**
     * @param list<array{palavra: string, variante: int, fonemas: string}> $entradas
     */
    public function inserirLote(array $entradas): void
    {
        if ([] === $entradas) {
            return;
        }

        $valores = [];
        $parametros = [];
        foreach ($entradas as $entrada) {
            $valores[] = '(?, ?, ?, ?)';
            array_push($parametros, Uuid::v7()->toBinary(), $entrada['palavra'], $entrada['variante'], $entrada['fonemas']);
        }

        $this->getEntityManager()->getConnection()->executeStatement(
            'INSERT IGNORE INTO palavra_dicionario_pronuncia (uuid, palavra, variante, fonemas) VALUES '.implode(', ', $valores),
            $parametros,
        );
    }
}
