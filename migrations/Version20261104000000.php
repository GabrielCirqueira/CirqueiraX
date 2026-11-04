<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261104000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Cria o áudio de cada parte do livro em vozes adicionais.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE livro_audio_bloco_voz (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', bloco_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', voz VARCHAR(64) NOT NULL, status VARCHAR(255) NOT NULL, caminho_audio VARCHAR(1024) DEFAULT NULL, duracao_segundos INT DEFAULT NULL, tamanho_bytes BIGINT DEFAULT NULL, trechos JSON DEFAULT NULL, erro_motivo LONGTEXT DEFAULT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_BLOCO_VOZ_BLOCO (bloco_uuid), UNIQUE INDEX UNIQ_BLOCO_VOZ (bloco_uuid, voz), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE livro_audio_bloco_voz ADD CONSTRAINT FK_BLOCO_VOZ_BLOCO FOREIGN KEY (bloco_uuid) REFERENCES livro_audio_bloco (uuid) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE livro_audio_bloco_voz DROP FOREIGN KEY FK_BLOCO_VOZ_BLOCO');
        $this->addSql('DROP TABLE livro_audio_bloco_voz');
    }
}
