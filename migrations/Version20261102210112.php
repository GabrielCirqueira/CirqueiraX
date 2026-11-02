<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261102210112 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE livro_audio (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, titulo VARCHAR(255) NOT NULL, caminho_pdf VARCHAR(1024) DEFAULT NULL, tamanho_bytes BIGINT DEFAULT NULL, total_paginas INT DEFAULT 0 NOT NULL, status VARCHAR(255) NOT NULL, erro_motivo LONGTEXT DEFAULT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_LIVRO_AUDIO_USUARIO_CRIADO_EM (usuario_id, criado_em), INDEX IDX_LIVRO_AUDIO_STATUS (status), INDEX IDX_2F0EF1BDDB38439E (usuario_id), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE livro_audio ADD CONSTRAINT FK_2F0EF1BDDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE livro_audio DROP FOREIGN KEY FK_2F0EF1BDDB38439E');
        $this->addSql('DROP TABLE livro_audio');
    }
}
