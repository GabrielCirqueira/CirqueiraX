<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261112150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Guarda os pares de músicas que o usuário marcou como diferentes na revisão de duplicadas.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE duplicata_descartada (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, primeira_musica_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', segunda_musica_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_DUPLICATA_DESCARTADA_USUARIO (usuario_id), INDEX IDX_DUPLICATA_DESCARTADA_PRIMEIRA (primeira_musica_uuid), INDEX IDX_DUPLICATA_DESCARTADA_SEGUNDA (segunda_musica_uuid), UNIQUE INDEX UNIQ_DUPLICATA_DESCARTADA_PAR (usuario_id, primeira_musica_uuid, segunda_musica_uuid), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE duplicata_descartada ADD CONSTRAINT FK_DUPLICATA_DESCARTADA_USUARIO FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE duplicata_descartada ADD CONSTRAINT FK_DUPLICATA_DESCARTADA_PRIMEIRA FOREIGN KEY (primeira_musica_uuid) REFERENCES musica_catalogo (uuid) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE duplicata_descartada ADD CONSTRAINT FK_DUPLICATA_DESCARTADA_SEGUNDA FOREIGN KEY (segunda_musica_uuid) REFERENCES musica_catalogo (uuid) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE duplicata_descartada DROP FOREIGN KEY FK_DUPLICATA_DESCARTADA_USUARIO');
        $this->addSql('ALTER TABLE duplicata_descartada DROP FOREIGN KEY FK_DUPLICATA_DESCARTADA_PRIMEIRA');
        $this->addSql('ALTER TABLE duplicata_descartada DROP FOREIGN KEY FK_DUPLICATA_DESCARTADA_SEGUNDA');
        $this->addSql('DROP TABLE duplicata_descartada');
    }
}
