<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261105025527 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE conta_spotify (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, spotify_id VARCHAR(255) NOT NULL, nome_exibicao VARCHAR(255) NOT NULL, url_foto VARCHAR(1024) DEFAULT NULL, access_token_criptografado LONGTEXT DEFAULT NULL, refresh_token_criptografado LONGTEXT DEFAULT NULL, expira_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', escopos LONGTEXT DEFAULT NULL, status VARCHAR(30) NOT NULL, conectado_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', ultima_coleta_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', cursor_ultima_reproducao_ms BIGINT DEFAULT NULL, erro_motivo VARCHAR(500) DEFAULT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_CONTA_SPOTIFY_SPOTIFY_ID (spotify_id), INDEX IDX_CONTA_SPOTIFY_STATUS (status), UNIQUE INDEX UNIQ_CONTA_SPOTIFY_USUARIO (usuario_id), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE conta_spotify ADD CONSTRAINT FK_A8700A0CDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE conta_spotify DROP FOREIGN KEY FK_A8700A0CDB38439E');
        $this->addSql('DROP TABLE conta_spotify');
    }
}
