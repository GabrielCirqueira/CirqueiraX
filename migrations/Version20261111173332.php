<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261111173332 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE artista_catalogo ADD unido_a_uuid BINARY(16) DEFAULT NULL COMMENT \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE artista_catalogo ADD CONSTRAINT FK_A382F726BC6552B1 FOREIGN KEY (unido_a_uuid) REFERENCES artista_catalogo (uuid) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_A382F726BC6552B1 ON artista_catalogo (unido_a_uuid)');
        $this->addSql('ALTER TABLE musica_catalogo ADD unida_a_uuid BINARY(16) DEFAULT NULL COMMENT \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE musica_catalogo ADD CONSTRAINT FK_6D9C0A0FA9EF4083 FOREIGN KEY (unida_a_uuid) REFERENCES musica_catalogo (uuid) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_6D9C0A0FA9EF4083 ON musica_catalogo (unida_a_uuid)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE artista_catalogo DROP FOREIGN KEY FK_A382F726BC6552B1');
        $this->addSql('DROP INDEX IDX_A382F726BC6552B1 ON artista_catalogo');
        $this->addSql('ALTER TABLE artista_catalogo DROP unido_a_uuid');
        $this->addSql('ALTER TABLE musica_catalogo DROP FOREIGN KEY FK_6D9C0A0FA9EF4083');
        $this->addSql('DROP INDEX IDX_6D9C0A0FA9EF4083 ON musica_catalogo');
        $this->addSql('ALTER TABLE musica_catalogo DROP unida_a_uuid');
    }
}
