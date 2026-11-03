<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261103000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adiciona o idioma do livro e a voz usada em cada parte do áudio.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE livro_audio ADD idioma VARCHAR(5) DEFAULT NULL');
        $this->addSql('ALTER TABLE livro_audio_bloco ADD voz VARCHAR(64) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE livro_audio_bloco DROP voz');
        $this->addSql('ALTER TABLE livro_audio DROP idioma');
    }
}
