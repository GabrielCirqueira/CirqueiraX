<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261103150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adiciona as marcações de tempo das frases narradas em cada parte do áudio.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE livro_audio_bloco ADD trechos JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE livro_audio_bloco DROP trechos');
    }
}
