<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261113100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Fonte ativa do YouTube Music por usuário (cookies ou extensão) e estado de pausa informado pela extensão.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE usuario ADD fonte_captura_youtube_music VARCHAR(20) DEFAULT 'coletor' NOT NULL");
        $this->addSql('ALTER TABLE reproducao_youtube ADD extensao_pausada TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql("UPDATE usuario u SET u.fonte_captura_youtube_music = 'extensao' WHERE EXISTS (SELECT 1 FROM token_extensao_youtube_music t WHERE t.usuario_id = u.id AND t.revogado_em IS NULL)");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE usuario DROP fonte_captura_youtube_music');
        $this->addSql('ALTER TABLE reproducao_youtube DROP extensao_pausada');
    }
}
