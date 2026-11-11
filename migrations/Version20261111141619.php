<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261111141619 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE consulta_spotify_hora (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', hora DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', origem VARCHAR(40) NOT NULL, total INT NOT NULL, UNIQUE INDEX UNIQ_CONSULTA_SPOTIFY_HORA_ORIGEM (hora, origem), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE bloqueio_spotify ADD consultas_por_origem_ultimas24h JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE consulta_spotify_hora');
        $this->addSql('ALTER TABLE bloqueio_spotify DROP consultas_por_origem_ultimas24h');
    }
}
