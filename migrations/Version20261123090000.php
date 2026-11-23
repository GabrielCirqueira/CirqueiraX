<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261123090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Posição do player informada pela extensão do YouTube Music';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reproducao_youtube ADD extensao_posicao_ms INT DEFAULT NULL, ADD extensao_posicao_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reproducao_youtube DROP extensao_posicao_ms, DROP extensao_posicao_em');
    }
}
