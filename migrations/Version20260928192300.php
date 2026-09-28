<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260928192300 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adiciona coluna email e indice unico na tabela usuario';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE usuario ADD email VARCHAR(180) NOT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_USUARIO_EMAIL ON usuario (email)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_USUARIO_EMAIL ON usuario');
        $this->addSql('ALTER TABLE usuario DROP email');
    }
}
