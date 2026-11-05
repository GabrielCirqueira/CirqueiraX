<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261105183721 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Criação da tabela imagem_spotify para catálogo e cache de capas de álbuns e fotos de artistas do Spotify';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE imagem_spotify (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', tipo VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL, chave_busca VARCHAR(255) NOT NULL, codigo_spotify VARCHAR(64) DEFAULT NULL, nome VARCHAR(255) NOT NULL, artista VARCHAR(255) DEFAULT NULL, imagem_grande_url VARCHAR(1024) DEFAULT NULL, imagem_media_url VARCHAR(1024) DEFAULT NULL, imagem_pequena_url VARCHAR(1024) DEFAULT NULL, url_spotify VARCHAR(1024) DEFAULT NULL, cor_dominante VARCHAR(16) DEFAULT NULL, duracao_ms INT DEFAULT NULL, tentativas INT NOT NULL, motivo_falha VARCHAR(500) DEFAULT NULL, buscada_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_IMAGEM_SPOTIFY_CODIGO (codigo_spotify), INDEX IDX_IMAGEM_SPOTIFY_TIPO_STATUS (tipo, status), UNIQUE INDEX UNIQ_IMAGEM_SPOTIFY_CHAVE_BUSCA (chave_busca), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE imagem_spotify');
    }
}
