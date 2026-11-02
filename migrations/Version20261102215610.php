<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261102215610 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE livro_audio_bloco (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', livro_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', numero_bloco INT NOT NULL, pagina_inicio INT NOT NULL, pagina_fim INT NOT NULL, texto LONGTEXT NOT NULL, caminho_audio VARCHAR(1024) DEFAULT NULL, duracao_segundos INT DEFAULT NULL, tamanho_bytes BIGINT DEFAULT NULL, status VARCHAR(255) NOT NULL, erro_motivo LONGTEXT DEFAULT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_BLOCO_AUDIO_STATUS (status), INDEX IDX_BLOCO_AUDIO_LIVRO (livro_uuid), UNIQUE INDEX UNIQ_LIVRO_BLOCO_NUMERO (livro_uuid, numero_bloco), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE livro_audio_bloco ADD CONSTRAINT FK_E80B00F7A83884D FOREIGN KEY (livro_uuid) REFERENCES livro_audio (uuid) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE livro_audio_bloco DROP FOREIGN KEY FK_E80B00F7A83884D');
        $this->addSql('DROP TABLE livro_audio_bloco');
    }
}
