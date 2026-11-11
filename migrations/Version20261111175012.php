<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261111175012 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE importacao_youtube (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, status VARCHAR(30) NOT NULL, caminho_arquivo VARCHAR(500) NOT NULL, nome_arquivo_original VARCHAR(255) NOT NULL, tamanho_bytes BIGINT NOT NULL, total_lidos INT NOT NULL, total_descartados INT NOT NULL, total_novos INT NOT NULL, total_ignorados INT NOT NULL, total_unificados INT NOT NULL, total_videos_novos INT NOT NULL, erro_motivo LONGTEXT DEFAULT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', iniciado_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', concluido_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_IMPORTACAO_YOUTUBE_USUARIO_STATUS (usuario_id, status), INDEX IDX_8738E934DB38439E (usuario_id), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE importacao_youtube ADD CONSTRAINT FK_8738E934DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE video_youtube ADD aguardando_importacao TINYINT(1) NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE importacao_youtube DROP FOREIGN KEY FK_8738E934DB38439E');
        $this->addSql('DROP TABLE importacao_youtube');
        $this->addSql('ALTER TABLE video_youtube DROP aguardando_importacao');
    }
}
