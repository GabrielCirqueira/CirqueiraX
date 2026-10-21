<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261021112252 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE registro_envio_google_fotos (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', media_item_uuid VARCHAR(36) NOT NULL, origem_midia VARCHAR(255) NOT NULL, nome_arquivo VARCHAR(255) DEFAULT NULL, tipo_arquivo VARCHAR(100) DEFAULT NULL, tamanho_bytes BIGINT DEFAULT NULL, data_midia DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', categoria_nome VARCHAR(255) DEFAULT NULL, album_id VARCHAR(255) DEFAULT NULL, conta_email VARCHAR(255) DEFAULT NULL, status VARCHAR(255) NOT NULL, origem_envio VARCHAR(255) NOT NULL, tentativa INT NOT NULL, google_photos_media_id VARCHAR(255) DEFAULT NULL, google_photos_url VARCHAR(1024) DEFAULT NULL, erro_motivo LONGTEXT DEFAULT NULL, iniciado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', finalizado_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', duracao_ms INT DEFAULT NULL, INDEX IDX_REGISTRO_ENVIO_MEDIA_ITEM (media_item_uuid), INDEX IDX_REGISTRO_ENVIO_INICIADO_EM (iniciado_em), INDEX IDX_REGISTRO_ENVIO_STATUS (status), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE media_item CHANGE data_exibicao data_exibicao DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE registro_envio_google_fotos');
        $this->addSql('ALTER TABLE media_item CHANGE data_exibicao data_exibicao DATETIME NOT NULL');
    }
}
