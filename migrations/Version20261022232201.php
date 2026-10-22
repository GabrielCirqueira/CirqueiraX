<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261022232201 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE audio (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, url VARCHAR(1024) NOT NULL, status VARCHAR(255) NOT NULL, titulo VARCHAR(512) DEFAULT NULL, autor VARCHAR(255) DEFAULT NULL, duracao_segundos INT DEFAULT NULL, thumbnail_url VARCHAR(1024) DEFAULT NULL, caminho_arquivo VARCHAR(512) DEFAULT NULL, tamanho_bytes BIGINT DEFAULT NULL, erro_motivo LONGTEXT DEFAULT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', baixado_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', expirado_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_AUDIO_USUARIO_CRIADO_EM (usuario_id, criado_em), INDEX IDX_AUDIO_STATUS_BAIXADO_EM (status, baixado_em), INDEX IDX_187D3695DB38439E (usuario_id), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE audio ADD CONSTRAINT FK_187D3695DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE audio DROP FOREIGN KEY FK_187D3695DB38439E');
        $this->addSql('DROP TABLE audio');
    }
}
