<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261111181335 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE reproducao_musical (id BIGINT AUTO_INCREMENT NOT NULL, usuario_id INT NOT NULL, musica_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', musica_origem_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', fonte VARCHAR(20) NOT NULL, tocada_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', ms_reproduzidos INT NOT NULL, tempo_exato TINYINT(1) NOT NULL, pulada TINYINT(1) DEFAULT NULL, aleatorio TINYINT(1) DEFAULT NULL, origem_id VARCHAR(36) NOT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_REPRODUCAO_MUSICAL_USUARIO_TOCADA (usuario_id, tocada_em), INDEX IDX_REPRODUCAO_MUSICAL_USUARIO_MUSICA (usuario_id, musica_uuid), INDEX IDX_REPRODUCAO_MUSICAL_USUARIO_FONTE_TOCADA (usuario_id, fonte, tocada_em), INDEX IDX_REPRODUCAO_MUSICAL_MUSICA_ORIGEM (musica_origem_uuid), UNIQUE INDEX UNIQ_REPRODUCAO_MUSICAL_FONTE_ORIGEM (fonte, origem_id), INDEX IDX_36D48F96DB38439E (usuario_id), INDEX IDX_36D48F96D5A33DA8 (musica_uuid), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE reproducao_musical ADD CONSTRAINT FK_36D48F96DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE reproducao_musical ADD CONSTRAINT FK_36D48F96D5A33DA8 FOREIGN KEY (musica_uuid) REFERENCES musica_catalogo (uuid) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE reproducao_musical ADD CONSTRAINT FK_36D48F967057D25A FOREIGN KEY (musica_origem_uuid) REFERENCES musica_catalogo (uuid) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reproducao_musical DROP FOREIGN KEY FK_36D48F96DB38439E');
        $this->addSql('ALTER TABLE reproducao_musical DROP FOREIGN KEY FK_36D48F96D5A33DA8');
        $this->addSql('ALTER TABLE reproducao_musical DROP FOREIGN KEY FK_36D48F967057D25A');
        $this->addSql('DROP TABLE reproducao_musical');
    }
}
