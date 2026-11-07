<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261106230359 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adiciona os campos pulada e aleatorio em reproducao_spotify, vindos do histórico estendido';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reproducao_spotify ADD pulada TINYINT(1) DEFAULT NULL, ADD aleatorio TINYINT(1) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reproducao_spotify DROP pulada, DROP aleatorio');
    }
}
