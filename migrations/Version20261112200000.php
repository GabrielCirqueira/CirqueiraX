<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261112200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Aumenta a duração do vídeo do YouTube para BIGINT, porque lives longas passam do limite do INT em milissegundos.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE video_youtube CHANGE duracao_ms duracao_ms BIGINT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE video_youtube CHANGE duracao_ms duracao_ms INT DEFAULT NULL');
    }
}
