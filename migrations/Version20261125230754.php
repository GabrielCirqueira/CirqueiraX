<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261125230754 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Cria a tabela de letras de música do módulo Inglês & Pronúncia (aba Tocando agora)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE letra_musica_pronuncia (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', codigo_faixa VARCHAR(64) NOT NULL, titulo VARCHAR(255) NOT NULL, artista VARCHAR(255) NOT NULL, album VARCHAR(255) DEFAULT NULL, duracao_ms INT NOT NULL, situacao VARCHAR(20) NOT NULL, linhas JSON NOT NULL, traducoes JSON DEFAULT NULL, buscada_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', criada_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_LETRA_MUSICA_CODIGO_FAIXA (codigo_faixa), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE letra_musica_pronuncia');
    }
}
