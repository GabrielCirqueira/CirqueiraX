<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ArtistaFaixaSpotify;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use PDO;

/**
 * @extends ServiceEntityRepository<ArtistaFaixaSpotify>
 */
final class ArtistaFaixaSpotifyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ArtistaFaixaSpotify::class);
    }

    /**
     * @param list<array{nome: string, codigo: ?string}> $artistas
     */
    public function registrarArtistasDaFaixa(string $codigoFaixa, array $artistas): int
    {
        $codigo = trim($codigoFaixa);
        if ('' === $codigo || [] === $artistas) {
            return 0;
        }

        $conexao = $this->getEntityManager()->getConnection();
        $nomesVistos = [];
        $inseridos = 0;
        $posicao = 0;

        foreach ($artistas as $artista) {
            $nome = trim($artista['nome']);
            $chave = mb_strtolower($nome);
            if ('' === $nome || isset($nomesVistos[$chave])) {
                continue;
            }
            $nomesVistos[$chave] = true;

            $inseridos += (int) $conexao->executeStatement(
                'INSERT IGNORE INTO artista_faixa_spotify (codigo_faixa, posicao, nome_artista, codigo_artista, criado_em)
                VALUES (:codigoFaixa, :posicao, :nome, :codigoArtista, UTC_TIMESTAMP())',
                [
                    'codigoFaixa' => $codigo,
                    'posicao' => $posicao,
                    'nome' => mb_substr($nome, 0, 255),
                    'codigoArtista' => null !== $artista['codigo'] && '' !== trim($artista['codigo']) ? trim($artista['codigo']) : null,
                ],
            );
            ++$posicao;
        }

        return $inseridos;
    }

    /**
     * @return list<array{codigo_faixa: string, artista: string, codigo_artista: ?string}>
     */
    public function listarFaixasSemArtistas(Usuario $usuario, int $limite): array
    {
        /** @var list<array{codigo_faixa: string, artista: string, codigo_artista: ?string}> $linhas */
        $linhas = $this->getEntityManager()->getConnection()->executeQuery(
            'SELECT r.codigo_faixa, MAX(r.artista_principal) AS artista, MAX(r.codigo_artista_principal) AS codigo_artista
            FROM reproducao_spotify r
            LEFT JOIN artista_faixa_spotify af ON af.codigo_faixa = r.codigo_faixa
            WHERE r.usuario_id = :usuarioId AND r.codigo_faixa IS NOT NULL AND r.codigo_faixa <> \'\' AND af.id IS NULL
            GROUP BY r.codigo_faixa
            ORDER BY MAX(r.tocada_em) DESC
            LIMIT :limite',
            ['usuarioId' => $usuario->getId(), 'limite' => $limite],
            ['limite' => PDO::PARAM_INT],
        )->fetchAllAssociative();

        return $linhas;
    }

    public function contarFaixasSemArtistas(Usuario $usuario): int
    {
        return (int) $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT COUNT(DISTINCT r.codigo_faixa)
            FROM reproducao_spotify r
            LEFT JOIN artista_faixa_spotify af ON af.codigo_faixa = r.codigo_faixa
            WHERE r.usuario_id = :usuarioId AND r.codigo_faixa IS NOT NULL AND r.codigo_faixa <> \'\' AND af.id IS NULL',
            ['usuarioId' => $usuario->getId()],
        );
    }
}
