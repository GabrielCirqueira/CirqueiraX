<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261104180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Cria os marcadores, destaques e notas dos livros em áudio.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE marcacao_livro_audio (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', livro_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', tipo VARCHAR(20) NOT NULL, pagina INT NOT NULL, numero_bloco INT DEFAULT NULL, indice_trecho INT DEFAULT NULL, segundos DOUBLE PRECISION DEFAULT NULL, texto LONGTEXT DEFAULT NULL, nota LONGTEXT DEFAULT NULL, retangulos JSON DEFAULT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_MARCACAO_LIVRO_PAGINA (livro_uuid, pagina), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE marcacao_livro_audio ADD CONSTRAINT FK_MARCACAO_LIVRO FOREIGN KEY (livro_uuid) REFERENCES livro_audio (uuid) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE marcacao_livro_audio DROP FOREIGN KEY FK_MARCACAO_LIVRO');
        $this->addSql('DROP TABLE marcacao_livro_audio');
    }
}
