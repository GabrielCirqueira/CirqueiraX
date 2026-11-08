<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261108220436 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Cria artista_faixa_spotify com todos os artistas de cada música do Spotify';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE artista_faixa_spotify (id INT AUTO_INCREMENT NOT NULL, codigo_faixa VARCHAR(64) NOT NULL, posicao SMALLINT NOT NULL, nome_artista VARCHAR(255) NOT NULL, codigo_artista VARCHAR(64) DEFAULT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_ARTISTA_FAIXA_SPOTIFY_ARTISTA (nome_artista), UNIQUE INDEX UNIQ_ARTISTA_FAIXA_SPOTIFY_FAIXA_POSICAO (codigo_faixa, posicao), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE artista_faixa_spotify');
    }
}
