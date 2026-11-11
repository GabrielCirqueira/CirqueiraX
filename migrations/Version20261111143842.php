<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261111143842 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE conta_youtube_music (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, credenciais_criptografadas LONGTEXT DEFAULT NULL, nome_conta VARCHAR(255) DEFAULT NULL, status VARCHAR(30) NOT NULL, conectado_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', ultima_consulta_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', ultima_novidade_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', proxima_consulta_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', erros_seguidos INT NOT NULL, erro_motivo VARCHAR(500) DEFAULT NULL, snapshot_topo JSON DEFAULT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_CONTA_YOUTUBE_MUSIC_STATUS_PROXIMA (status, proxima_consulta_em), UNIQUE INDEX UNIQ_CONTA_YOUTUBE_MUSIC_USUARIO (usuario_id), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE conta_youtube_music ADD CONSTRAINT FK_A0067B89DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE conta_youtube_music DROP FOREIGN KEY FK_A0067B89DB38439E');
        $this->addSql('DROP TABLE conta_youtube_music');
    }
}
