<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261106120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Recalcula ms_reproduzidos das reproduções coletadas pela API do Spotify usando o intervalo até a reprodução anterior, limitado à duração da faixa';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("
            UPDATE reproducao_spotify r
            INNER JOIN (
                SELECT
                    uuid,
                    LAG(tocada_em) OVER (PARTITION BY usuario_id ORDER BY tocada_em, uuid) AS tocada_anterior
                FROM reproducao_spotify
            ) vizinhos ON vizinhos.uuid = r.uuid
            SET r.ms_reproduzidos = CASE
                WHEN vizinhos.tocada_anterior IS NULL THEN r.duracao_ms
                WHEN TIMESTAMPDIFF(SECOND, vizinhos.tocada_anterior, r.tocada_em) <= 0 THEN r.duracao_ms
                ELSE LEAST(r.duracao_ms, TIMESTAMPDIFF(SECOND, vizinhos.tocada_anterior, r.tocada_em) * 1000)
            END
            WHERE r.fonte = 'api'
              AND r.duracao_ms IS NOT NULL
              AND r.duracao_ms > 0
        ");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("
            UPDATE reproducao_spotify
            SET ms_reproduzidos = duracao_ms
            WHERE fonte = 'api'
              AND duracao_ms IS NOT NULL
              AND duracao_ms > 0
        ");
    }
}
