<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261116145035 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE conta_youtube_oauth (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, email VARCHAR(255) NOT NULL, nome_canal VARCHAR(255) DEFAULT NULL, canal_id VARCHAR(64) DEFAULT NULL, refresh_token_criptografado LONGTEXT NOT NULL, access_token_cache LONGTEXT DEFAULT NULL, expira_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_CONTA_YOUTUBE_OAUTH_USUARIO (usuario_id), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE item_transferencia_playlist (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', transferencia_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', playlist_selecionada_uuid BINARY(16) DEFAULT NULL COMMENT \'(DC2Type:uuid)\', musica_catalogo_uuid BINARY(16) DEFAULT NULL COMMENT \'(DC2Type:uuid)\', ordem INT NOT NULL, id_externo_origem VARCHAR(128) NOT NULL, titulo_origem VARCHAR(512) NOT NULL, artistas_origem VARCHAR(512) NOT NULL, duracao_ms_origem INT DEFAULT NULL, url_capa_origem VARCHAR(1024) DEFAULT NULL, id_externo_destino VARCHAR(128) DEFAULT NULL, titulo_destino VARCHAR(512) DEFAULT NULL, artistas_destino VARCHAR(512) DEFAULT NULL, pontuacao INT DEFAULT NULL, status VARCHAR(30) NOT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_ITEM_TRANSF_PLAYLIST_TRANSFERENCIA (transferencia_uuid), INDEX IDX_ITEM_TRANSF_PLAYLIST_STATUS (status), INDEX IDX_DBEF3810E0F945B (playlist_selecionada_uuid), INDEX IDX_DBEF381045ED0376 (musica_catalogo_uuid), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE item_vinculo_playlist (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', vinculo_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', musica_catalogo_uuid BINARY(16) DEFAULT NULL COMMENT \'(DC2Type:uuid)\', id_faixa_spotify VARCHAR(128) DEFAULT NULL, id_video_youtube VARCHAR(128) DEFAULT NULL, id_item_playlist_youtube VARCHAR(128) DEFAULT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_ITEM_VINCULO_PLAYLIST_VINCULO (vinculo_uuid), INDEX IDX_419D410745ED0376 (musica_catalogo_uuid), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE playlist_transferencia_selecionada (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', transferencia_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', id_externo_origem VARCHAR(128) NOT NULL, nome_origem VARCHAR(512) NOT NULL, total_faixas_origem INT NOT NULL, url_capa_origem VARCHAR(1024) DEFAULT NULL, snapshot_id_origem VARCHAR(128) DEFAULT NULL, id_externo_destino_existente VARCHAR(128) DEFAULT NULL, nome_destino_existente VARCHAR(512) DEFAULT NULL, decisao VARCHAR(40) NOT NULL, id_externo_destino_final VARCHAR(128) DEFAULT NULL, progresso_faixas INT NOT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_PLAYLIST_TRANSF_SELEC_TRANSFERENCIA (transferencia_uuid), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE transferencia_playlist (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, origem VARCHAR(20) NOT NULL, destino VARCHAR(20) NOT NULL, status VARCHAR(30) NOT NULL, total_faixas INT NOT NULL, total_casadas INT NOT NULL, total_duvidosas INT NOT NULL, total_nao_encontradas INT NOT NULL, total_transferidas INT NOT NULL, total_falhas INT NOT NULL, mensagem_erro LONGTEXT DEFAULT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_TRANSFERENCIA_PLAYLIST_USUARIO (usuario_id), INDEX IDX_TRANSFERENCIA_PLAYLIST_STATUS (status), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE vinculo_playlist (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, id_spotify VARCHAR(128) NOT NULL, nome_spotify VARCHAR(512) NOT NULL, snapshot_id_spotify VARCHAR(128) DEFAULT NULL, id_youtube VARCHAR(128) NOT NULL, nome_youtube VARCHAR(512) NOT NULL, modo VARCHAR(40) NOT NULL, foto_estado_json LONGTEXT DEFAULT NULL, ativo TINYINT(1) NOT NULL, ultima_sincronizacao_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_VINCULO_PLAYLIST_USUARIO (usuario_id), UNIQUE INDEX UNIQ_VINCULO_PLAYLIST_USUARIO_IDS (usuario_id, id_spotify, id_youtube), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE conta_youtube_oauth ADD CONSTRAINT FK_698E2107DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE item_transferencia_playlist ADD CONSTRAINT FK_DBEF38106965C033 FOREIGN KEY (transferencia_uuid) REFERENCES transferencia_playlist (uuid) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE item_transferencia_playlist ADD CONSTRAINT FK_DBEF3810E0F945B FOREIGN KEY (playlist_selecionada_uuid) REFERENCES playlist_transferencia_selecionada (uuid) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE item_transferencia_playlist ADD CONSTRAINT FK_DBEF381045ED0376 FOREIGN KEY (musica_catalogo_uuid) REFERENCES musica_catalogo (uuid) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE item_vinculo_playlist ADD CONSTRAINT FK_419D41072A87102E FOREIGN KEY (vinculo_uuid) REFERENCES vinculo_playlist (uuid) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE item_vinculo_playlist ADD CONSTRAINT FK_419D410745ED0376 FOREIGN KEY (musica_catalogo_uuid) REFERENCES musica_catalogo (uuid) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE playlist_transferencia_selecionada ADD CONSTRAINT FK_CE65CA786965C033 FOREIGN KEY (transferencia_uuid) REFERENCES transferencia_playlist (uuid) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE transferencia_playlist ADD CONSTRAINT FK_D598792EDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE vinculo_playlist ADD CONSTRAINT FK_79FF4218DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE conta_youtube_oauth DROP FOREIGN KEY FK_698E2107DB38439E');
        $this->addSql('ALTER TABLE item_transferencia_playlist DROP FOREIGN KEY FK_DBEF38106965C033');
        $this->addSql('ALTER TABLE item_transferencia_playlist DROP FOREIGN KEY FK_DBEF3810E0F945B');
        $this->addSql('ALTER TABLE item_transferencia_playlist DROP FOREIGN KEY FK_DBEF381045ED0376');
        $this->addSql('ALTER TABLE item_vinculo_playlist DROP FOREIGN KEY FK_419D41072A87102E');
        $this->addSql('ALTER TABLE item_vinculo_playlist DROP FOREIGN KEY FK_419D410745ED0376');
        $this->addSql('ALTER TABLE playlist_transferencia_selecionada DROP FOREIGN KEY FK_CE65CA786965C033');
        $this->addSql('ALTER TABLE transferencia_playlist DROP FOREIGN KEY FK_D598792EDB38439E');
        $this->addSql('ALTER TABLE vinculo_playlist DROP FOREIGN KEY FK_79FF4218DB38439E');
        $this->addSql('DROP TABLE conta_youtube_oauth');
        $this->addSql('DROP TABLE item_transferencia_playlist');
        $this->addSql('DROP TABLE item_vinculo_playlist');
        $this->addSql('DROP TABLE playlist_transferencia_selecionada');
        $this->addSql('DROP TABLE transferencia_playlist');
        $this->addSql('DROP TABLE vinculo_playlist');
    }
}
