<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261124150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Índice de cobertura do código do artista nas reproduções do Spotify';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reproducao_spotify DROP INDEX IDX_REPRODUCAO_SPOTIFY_USUARIO_ARTISTA, ADD INDEX IDX_REPRODUCAO_SPOTIFY_USUARIO_ARTISTA (usuario_id, artista_principal, codigo_artista_principal), ALGORITHM=INPLACE, LOCK=NONE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reproducao_spotify DROP INDEX IDX_REPRODUCAO_SPOTIFY_USUARIO_ARTISTA, ADD INDEX IDX_REPRODUCAO_SPOTIFY_USUARIO_ARTISTA (usuario_id, artista_principal), ALGORITHM=INPLACE, LOCK=NONE');
    }
}
