<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261105030816 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE reproducao_spotify (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, codigo_faixa VARCHAR(255) DEFAULT NULL, nome_faixa VARCHAR(255) NOT NULL, artista_principal VARCHAR(255) NOT NULL, codigo_artista_principal VARCHAR(255) DEFAULT NULL, demais_artistas JSON DEFAULT NULL, album VARCHAR(255) NOT NULL, duracao_ms INT DEFAULT NULL, ms_reproduzidos INT NOT NULL, tocada_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', fonte VARCHAR(30) NOT NULL, chave_deduplicacao VARCHAR(255) NOT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_REPRODUCAO_SPOTIFY_USUARIO_TOCADA_EM (usuario_id, tocada_em), INDEX IDX_REPRODUCAO_SPOTIFY_USUARIO_ARTISTA (usuario_id, artista_principal), INDEX IDX_REPRODUCAO_SPOTIFY_USUARIO_FAIXA (usuario_id, nome_faixa), INDEX IDX_REPRODUCAO_SPOTIFY_FONTE (fonte), UNIQUE INDEX UNIQ_REPRODUCAO_SPOTIFY_USUARIO_CHAVE (usuario_id, chave_deduplicacao), INDEX IDX_7990FB8DDB38439E (usuario_id), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE reproducao_spotify ADD CONSTRAINT FK_7990FB8DDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reproducao_spotify DROP FOREIGN KEY FK_7990FB8DDB38439E');
        $this->addSql('DROP TABLE reproducao_spotify');
    }
}
