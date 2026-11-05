<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261105120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Fila de geração com pausa e prioridade, posição com horário de registro, tempo ouvido por dia e meta diária.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE livro_audio ADD posicao_registrada_em BIGINT DEFAULT NULL, ADD fila_pausada TINYINT(1) DEFAULT 0 NOT NULL, ADD prioridade_fila INT DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE usuario ADD meta_escuta_minutos SMALLINT DEFAULT 30 NOT NULL');
        $this->addSql('CREATE TABLE escuta_livro_audio_dia (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, livro_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', dia DATE NOT NULL COMMENT \'(DC2Type:date_immutable)\', segundos INT DEFAULT 0 NOT NULL, atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_ESCUTA_USUARIO_DIA (usuario_id, dia), UNIQUE INDEX UNIQ_ESCUTA_LIVRO_DIA (livro_uuid, dia), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE escuta_livro_audio_dia ADD CONSTRAINT FK_ESCUTA_USUARIO FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE escuta_livro_audio_dia ADD CONSTRAINT FK_ESCUTA_LIVRO FOREIGN KEY (livro_uuid) REFERENCES livro_audio (uuid) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE escuta_livro_audio_dia DROP FOREIGN KEY FK_ESCUTA_USUARIO');
        $this->addSql('ALTER TABLE escuta_livro_audio_dia DROP FOREIGN KEY FK_ESCUTA_LIVRO');
        $this->addSql('DROP TABLE escuta_livro_audio_dia');
        $this->addSql('ALTER TABLE usuario DROP meta_escuta_minutos');
        $this->addSql('ALTER TABLE livro_audio DROP posicao_registrada_em, DROP fila_pausada, DROP prioridade_fila');
    }
}
