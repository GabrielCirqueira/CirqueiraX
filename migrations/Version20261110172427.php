<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261110172427 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Cria o registro de bloqueios (429) da API do Spotify e grava o bloqueio em curso de 10/11/2026 13:33.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE bloqueio_spotify (id INT AUTO_INCREMENT NOT NULL, ocorrido_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', segundos_espera INT NOT NULL, origem VARCHAR(40) NOT NULL, liberado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', consultas_desde_ultimo_bloqueio INT NOT NULL, intervalo_entre_consultas_segundos INT NOT NULL, INDEX IDX_BLOQUEIO_SPOTIFY_OCORRIDO_EM (ocorrido_em), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql("INSERT INTO bloqueio_spotify (ocorrido_em, segundos_espera, origem, liberado_em, consultas_desde_ultimo_bloqueio, intervalo_entre_consultas_segundos) VALUES ('2026-11-10 13:33:36', 24179, 'busca_artistas', '2026-11-10 20:17:35', 0, 2)");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE bloqueio_spotify');
    }
}
