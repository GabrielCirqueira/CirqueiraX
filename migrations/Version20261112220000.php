<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261112220000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Corrige o horário das reproduções da extensão do YouTube Music que herdaram o início da música anterior e remove as cópias que o coletor gravou por causa disso.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            UPDATE reproducao_youtube
            SET tocada_em = CONVERT_TZ(criado_em, @@session.time_zone, '+00:00') - INTERVAL 3 SECOND
            WHERE fonte = 'extensao'
              AND ABS(TIMESTAMPDIFF(SECOND, tocada_em, CONVERT_TZ(criado_em, @@session.time_zone, '+00:00'))) > 60
            SQL);

        $this->addSql(<<<'SQL'
            CREATE TEMPORARY TABLE tmp_coleta_duplicada AS
            SELECT coletor_uuid, extensao_uuid FROM (
                SELECT c.uuid AS coletor_uuid,
                       e.uuid AS extensao_uuid,
                       ROW_NUMBER() OVER (PARTITION BY e.uuid ORDER BY ABS(TIMESTAMPDIFF(SECOND, e.tocada_em, c.tocada_em))) AS ordem_extensao,
                       ROW_NUMBER() OVER (PARTITION BY c.uuid ORDER BY ABS(TIMESTAMPDIFF(SECOND, e.tocada_em, c.tocada_em))) AS ordem_coletor
                FROM reproducao_youtube c
                JOIN reproducao_youtube e
                  ON e.usuario_id = c.usuario_id
                 AND e.video_uuid = c.video_uuid
                 AND e.fonte = 'extensao'
                 AND e.vista_pelo_coletor = 0
                 AND ABS(TIMESTAMPDIFF(SECOND, e.tocada_em, c.tocada_em)) <= 600
                WHERE c.fonte = 'coletor'
            ) pares
            WHERE ordem_extensao = 1 AND ordem_coletor = 1
            SQL);

        $this->addSql('UPDATE reproducao_youtube r JOIN tmp_coleta_duplicada d ON d.extensao_uuid = r.uuid SET r.vista_pelo_coletor = 1');
        $this->addSql('DELETE r FROM reproducao_youtube r JOIN tmp_coleta_duplicada d ON d.coletor_uuid = r.uuid');
        $this->addSql('DROP TEMPORARY TABLE tmp_coleta_duplicada');
    }

    public function down(Schema $schema): void
    {
    }
}
