<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\DuplicataDescartada;
use App\Entity\MusicaCatalogo;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<DuplicataDescartada>
 */
final class DuplicataDescartadaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DuplicataDescartada::class);
    }

    public function salvar(DuplicataDescartada $duplicata, bool $flush = true): void
    {
        $this->getEntityManager()->persist($duplicata);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function buscarPar(Usuario $usuario, MusicaCatalogo $primeira, MusicaCatalogo $segunda): ?DuplicataDescartada
    {
        /** @var DuplicataDescartada|null $resultado */
        $resultado = $this->findOneBy(['usuario' => $usuario, 'primeiraMusica' => $primeira, 'segundaMusica' => $segunda]);

        return $resultado;
    }

    /**
     * @return array<string, true>
     */
    public function listarChavesDoUsuario(Usuario $usuario): array
    {
        $linhas = $this->getEntityManager()->getConnection()->executeQuery(
            'SELECT primeira_musica_uuid, segunda_musica_uuid FROM duplicata_descartada WHERE usuario_id = :usuarioId',
            ['usuarioId' => $usuario->getId()],
        )->fetchAllAssociative();

        $chaves = [];
        foreach ($linhas as $linha) {
            $chaves[DuplicataDescartada::chavePar(
                Uuid::fromBinary((string) $linha['primeira_musica_uuid'])->toRfc4122(),
                Uuid::fromBinary((string) $linha['segunda_musica_uuid'])->toRfc4122(),
            )] = true;
        }

        return $chaves;
    }
}
