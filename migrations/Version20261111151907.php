<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261111151907 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE cota_youtube_data_dia (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', dia DATE NOT NULL COMMENT \'(DC2Type:date_immutable)\', unidades_usadas INT NOT NULL, excedida_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_COTA_YOUTUBE_DATA_DIA (dia), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE video_youtube ADD detalhes_atualizados_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE INDEX IDX_VIDEO_YOUTUBE_DETALHES_ATUALIZADOS ON video_youtube (detalhes_atualizados_em)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE cota_youtube_data_dia');
        $this->addSql('DROP INDEX IDX_VIDEO_YOUTUBE_DETALHES_ATUALIZADOS ON video_youtube');
        $this->addSql('ALTER TABLE video_youtube DROP detalhes_atualizados_em');
    }
}
