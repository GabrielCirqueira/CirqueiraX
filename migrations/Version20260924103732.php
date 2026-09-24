<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260924103732 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE conta_google_fotos (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', email VARCHAR(255) NOT NULL, refresh_token_criptografado LONGTEXT NOT NULL, access_token_cache LONGTEXT DEFAULT NULL, expira_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_CONTA_GOOGLE_FOTOS_EMAIL (email), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE media_item (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', hash VARCHAR(64) NOT NULL, origem VARCHAR(50) NOT NULL, status VARCHAR(50) NOT NULL, caminho_local VARCHAR(512) DEFAULT NULL, google_photos_media_id VARCHAR(255) DEFAULT NULL, categoria_id VARCHAR(36) DEFAULT NULL, metadata JSON NOT NULL, erro_motivo LONGTEXT DEFAULT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_MEDIA_ITEM_HASH (hash), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE conta_google_fotos');
        $this->addSql('DROP TABLE media_item');
    }
}
