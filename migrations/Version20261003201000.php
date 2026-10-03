<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261003201000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adiciona coluna thumbnail_url na tabela media_item';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE media_item ADD thumbnail_url VARCHAR(1024) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE media_item DROP thumbnail_url');
    }
}
