<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261106213627 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Criação da tabela transcricao para transcrições de áudio por usuário com texto, trechos e áudio temporário';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE transcricao (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, titulo VARCHAR(255) NOT NULL, nome_arquivo_original VARCHAR(255) NOT NULL, mime_type VARCHAR(120) DEFAULT NULL, caminho_arquivo VARCHAR(512) DEFAULT NULL, tamanho_bytes BIGINT DEFAULT NULL, duracao_segundos DOUBLE PRECISION DEFAULT NULL, idioma_solicitado VARCHAR(10) NOT NULL, idioma_detectado VARCHAR(10) DEFAULT NULL, status VARCHAR(20) NOT NULL, progresso SMALLINT NOT NULL, texto LONGTEXT DEFAULT NULL, segmentos JSON DEFAULT NULL, total_palavras INT NOT NULL, erro_motivo LONGTEXT DEFAULT NULL, favorita TINYINT(1) NOT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', iniciado_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', concluido_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', audio_expirado_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_TRANSCRICAO_USUARIO_CRIADO_EM (usuario_id, criado_em), INDEX IDX_TRANSCRICAO_STATUS_CRIADO_EM (status, criado_em), INDEX IDX_241F0D64DB38439E (usuario_id), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE transcricao ADD CONSTRAINT FK_241F0D64DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE transcricao DROP FOREIGN KEY FK_241F0D64DB38439E');
        $this->addSql('DROP TABLE transcricao');
    }
}
