<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261104120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adiciona o modo de notas, o dicionário de pronúncia e a versão da narração aos livros em áudio.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE livro_audio ADD modo_notas VARCHAR(20) DEFAULT \'normal\' NOT NULL, ADD pronuncias JSON DEFAULT NULL, ADD versao_narracao SMALLINT DEFAULT 1 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE livro_audio DROP modo_notas, DROP pronuncias, DROP versao_narracao');
    }
}
