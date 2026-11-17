<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261117120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Índices de cobertura em reproducao_musical para as análises de música';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reproducao_musical
            DROP INDEX IDX_REPRODUCAO_MUSICAL_USUARIO_TOCADA,
            ADD INDEX IDX_REPRODUCAO_MUSICAL_USUARIO_TOCADA (usuario_id, tocada_em, fonte, musica_uuid, ms_reproduzidos, tempo_exato),
            DROP INDEX IDX_REPRODUCAO_MUSICAL_USUARIO_MUSICA,
            ADD INDEX IDX_REPRODUCAO_MUSICAL_USUARIO_MUSICA (usuario_id, musica_uuid, tocada_em, fonte, ms_reproduzidos, tempo_exato),
            ADD INDEX IDX_REPRODUCAO_MUSICAL_MUSICA_COBERTURA (musica_uuid, usuario_id, tocada_em, fonte, ms_reproduzidos)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reproducao_musical
            DROP INDEX IDX_REPRODUCAO_MUSICAL_MUSICA_COBERTURA,
            DROP INDEX IDX_REPRODUCAO_MUSICAL_USUARIO_MUSICA,
            ADD INDEX IDX_REPRODUCAO_MUSICAL_USUARIO_MUSICA (usuario_id, musica_uuid),
            DROP INDEX IDX_REPRODUCAO_MUSICAL_USUARIO_TOCADA,
            ADD INDEX IDX_REPRODUCAO_MUSICAL_USUARIO_TOCADA (usuario_id, tocada_em)');
    }
}
