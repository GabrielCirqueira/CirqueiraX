<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261111145156 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE alias_artista_catalogo (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, artista_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', alias_normalizado VARCHAR(255) NOT NULL, UNIQUE INDEX UNIQ_ALIAS_ARTISTA_CATALOGO_USUARIO_ALIAS (usuario_id, alias_normalizado), INDEX IDX_22663C48DB38439E (usuario_id), INDEX IDX_22663C48D2267633 (artista_uuid), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE artista_catalogo (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, nome VARCHAR(255) NOT NULL, nome_normalizado VARCHAR(255) NOT NULL, url_foto VARCHAR(1024) DEFAULT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_ARTISTA_CATALOGO_USUARIO_NOME (usuario_id, nome_normalizado), INDEX IDX_A382F726DB38439E (usuario_id), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE componente_mashup (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', mashup_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', musica_componente_uuid BINARY(16) DEFAULT NULL COMMENT \'(DC2Type:uuid)\', texto VARCHAR(500) NOT NULL, posicao SMALLINT NOT NULL, INDEX IDX_C1CBA3A0FBC8646E (mashup_uuid), INDEX IDX_C1CBA3A0E6ABA949 (musica_componente_uuid), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE musica_artista_catalogo (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', musica_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', artista_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', posicao SMALLINT NOT NULL, UNIQUE INDEX UNIQ_MUSICA_ARTISTA_CATALOGO (musica_uuid, artista_uuid), INDEX IDX_C932C1CCD5A33DA8 (musica_uuid), INDEX IDX_C932C1CCD2267633 (artista_uuid), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE musica_catalogo (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, titulo VARCHAR(500) NOT NULL, tipo VARCHAR(20) NOT NULL, chave_normalizada VARCHAR(512) NOT NULL, album VARCHAR(255) DEFAULT NULL, url_capa VARCHAR(1024) DEFAULT NULL, video_oficial_id VARCHAR(32) DEFAULT NULL, confirmada_manualmente TINYINT(1) NOT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_MUSICA_CATALOGO_USUARIO_CHAVE (usuario_id, chave_normalizada), INDEX IDX_6D9C0A0FDB38439E (usuario_id), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE regra_canal_youtube (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, canal_normalizado VARCHAR(255) NOT NULL, classificacao VARCHAR(20) NOT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_REGRA_CANAL_YOUTUBE_USUARIO_CANAL (usuario_id, canal_normalizado), INDEX IDX_33A40A57DB38439E (usuario_id), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE reproducao_youtube (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, video_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', tocada_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', ms_reproduzidos INT NOT NULL, tempo_exato TINYINT(1) NOT NULL, fonte VARCHAR(20) NOT NULL, chave_deduplicacao VARCHAR(64) NOT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_REPRODUCAO_YOUTUBE_USUARIO_TOCADA (usuario_id, tocada_em), UNIQUE INDEX UNIQ_REPRODUCAO_YOUTUBE_USUARIO_CHAVE (usuario_id, chave_deduplicacao), INDEX IDX_606158F1DB38439E (usuario_id), INDEX IDX_606158F1D6E80D7A (video_uuid), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE video_youtube (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, musica_catalogo_uuid BINARY(16) DEFAULT NULL COMMENT \'(DC2Type:uuid)\', video_id VARCHAR(32) NOT NULL, titulo VARCHAR(500) NOT NULL, canal VARCHAR(255) NOT NULL, canal_id VARCHAR(64) DEFAULT NULL, duracao_ms INT DEFAULT NULL, url_capa VARCHAR(1024) DEFAULT NULL, categoria_youtube VARCHAR(64) DEFAULT NULL, descricao_resumo LONGTEXT DEFAULT NULL, disponivel TINYINT(1) NOT NULL, status VARCHAR(20) NOT NULL, origem_classificacao VARCHAR(20) DEFAULT NULL, confianca SMALLINT DEFAULT NULL, resposta_ia JSON DEFAULT NULL, classificado_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', tipo_versao VARCHAR(20) DEFAULT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_VIDEO_YOUTUBE_USUARIO_STATUS (usuario_id, status), UNIQUE INDEX UNIQ_VIDEO_YOUTUBE_USUARIO_VIDEO (usuario_id, video_id), INDEX IDX_15957099DB38439E (usuario_id), INDEX IDX_1595709945ED0376 (musica_catalogo_uuid), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE vinculo_musica_spotify (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, musica_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', nome_normalizado VARCHAR(255) NOT NULL, artista_normalizado VARCHAR(255) NOT NULL, manual TINYINT(1) NOT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_VINCULO_MUSICA_SPOTIFY_IDENTIDADE (usuario_id, nome_normalizado, artista_normalizado), INDEX IDX_DD96B77DDB38439E (usuario_id), INDEX IDX_DD96B77DD5A33DA8 (musica_uuid), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE alias_artista_catalogo ADD CONSTRAINT FK_22663C48DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE alias_artista_catalogo ADD CONSTRAINT FK_22663C48D2267633 FOREIGN KEY (artista_uuid) REFERENCES artista_catalogo (uuid) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE artista_catalogo ADD CONSTRAINT FK_A382F726DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE componente_mashup ADD CONSTRAINT FK_C1CBA3A0FBC8646E FOREIGN KEY (mashup_uuid) REFERENCES musica_catalogo (uuid) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE componente_mashup ADD CONSTRAINT FK_C1CBA3A0E6ABA949 FOREIGN KEY (musica_componente_uuid) REFERENCES musica_catalogo (uuid) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE musica_artista_catalogo ADD CONSTRAINT FK_C932C1CCD5A33DA8 FOREIGN KEY (musica_uuid) REFERENCES musica_catalogo (uuid) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE musica_artista_catalogo ADD CONSTRAINT FK_C932C1CCD2267633 FOREIGN KEY (artista_uuid) REFERENCES artista_catalogo (uuid) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE musica_catalogo ADD CONSTRAINT FK_6D9C0A0FDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE regra_canal_youtube ADD CONSTRAINT FK_33A40A57DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE reproducao_youtube ADD CONSTRAINT FK_606158F1DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE reproducao_youtube ADD CONSTRAINT FK_606158F1D6E80D7A FOREIGN KEY (video_uuid) REFERENCES video_youtube (uuid) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE video_youtube ADD CONSTRAINT FK_15957099DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE video_youtube ADD CONSTRAINT FK_1595709945ED0376 FOREIGN KEY (musica_catalogo_uuid) REFERENCES musica_catalogo (uuid) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE vinculo_musica_spotify ADD CONSTRAINT FK_DD96B77DDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE vinculo_musica_spotify ADD CONSTRAINT FK_DD96B77DD5A33DA8 FOREIGN KEY (musica_uuid) REFERENCES musica_catalogo (uuid) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE alias_artista_catalogo DROP FOREIGN KEY FK_22663C48DB38439E');
        $this->addSql('ALTER TABLE alias_artista_catalogo DROP FOREIGN KEY FK_22663C48D2267633');
        $this->addSql('ALTER TABLE artista_catalogo DROP FOREIGN KEY FK_A382F726DB38439E');
        $this->addSql('ALTER TABLE componente_mashup DROP FOREIGN KEY FK_C1CBA3A0FBC8646E');
        $this->addSql('ALTER TABLE componente_mashup DROP FOREIGN KEY FK_C1CBA3A0E6ABA949');
        $this->addSql('ALTER TABLE musica_artista_catalogo DROP FOREIGN KEY FK_C932C1CCD5A33DA8');
        $this->addSql('ALTER TABLE musica_artista_catalogo DROP FOREIGN KEY FK_C932C1CCD2267633');
        $this->addSql('ALTER TABLE musica_catalogo DROP FOREIGN KEY FK_6D9C0A0FDB38439E');
        $this->addSql('ALTER TABLE regra_canal_youtube DROP FOREIGN KEY FK_33A40A57DB38439E');
        $this->addSql('ALTER TABLE reproducao_youtube DROP FOREIGN KEY FK_606158F1DB38439E');
        $this->addSql('ALTER TABLE reproducao_youtube DROP FOREIGN KEY FK_606158F1D6E80D7A');
        $this->addSql('ALTER TABLE video_youtube DROP FOREIGN KEY FK_15957099DB38439E');
        $this->addSql('ALTER TABLE video_youtube DROP FOREIGN KEY FK_1595709945ED0376');
        $this->addSql('ALTER TABLE vinculo_musica_spotify DROP FOREIGN KEY FK_DD96B77DDB38439E');
        $this->addSql('ALTER TABLE vinculo_musica_spotify DROP FOREIGN KEY FK_DD96B77DD5A33DA8');
        $this->addSql('DROP TABLE alias_artista_catalogo');
        $this->addSql('DROP TABLE artista_catalogo');
        $this->addSql('DROP TABLE componente_mashup');
        $this->addSql('DROP TABLE musica_artista_catalogo');
        $this->addSql('DROP TABLE musica_catalogo');
        $this->addSql('DROP TABLE regra_canal_youtube');
        $this->addSql('DROP TABLE reproducao_youtube');
        $this->addSql('DROP TABLE video_youtube');
        $this->addSql('DROP TABLE vinculo_musica_spotify');
    }
}
