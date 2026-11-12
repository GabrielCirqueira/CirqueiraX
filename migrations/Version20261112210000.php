<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261112210000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Preenche a capa dos vídeos do YouTube sem imagem (vindos do Takeout) com a miniatura padrão do YouTube.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("UPDATE video_youtube SET url_capa = CONCAT('https://i.ytimg.com/vi/', video_id, '/hqdefault.jpg') WHERE url_capa IS NULL");
    }

    public function down(Schema $schema): void
    {
    }
}
