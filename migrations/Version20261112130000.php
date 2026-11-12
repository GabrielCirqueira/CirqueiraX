<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261112130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Cria os tokens da extensão do YouTube Music e os campos de reprodução exata vinda da extensão.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE token_extensao_youtube_music (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, nome_aparelho VARCHAR(60) NOT NULL, token_hash VARCHAR(64) NOT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', ultimo_uso_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', revogado_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_TOKEN_EXTENSAO_YOUTUBE_USUARIO (usuario_id), UNIQUE INDEX UNIQ_TOKEN_EXTENSAO_YOUTUBE_HASH (token_hash), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE token_extensao_youtube_music ADD CONSTRAINT FK_40C9A65DDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE reproducao_youtube ADD id_extensao VARCHAR(64) DEFAULT NULL, ADD pulada TINYINT(1) DEFAULT NULL, ADD vista_pelo_coletor TINYINT(1) DEFAULT 0 NOT NULL, ADD extensao_atualizada_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_REPRODUCAO_YOUTUBE_USUARIO_EXTENSAO ON reproducao_youtube (usuario_id, id_extensao)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_REPRODUCAO_YOUTUBE_USUARIO_EXTENSAO ON reproducao_youtube');
        $this->addSql('ALTER TABLE reproducao_youtube DROP id_extensao, DROP pulada, DROP vista_pelo_coletor, DROP extensao_atualizada_em');
        $this->addSql('ALTER TABLE token_extensao_youtube_music DROP FOREIGN KEY FK_40C9A65DDB38439E');
        $this->addSql('DROP TABLE token_extensao_youtube_music');
    }
}
