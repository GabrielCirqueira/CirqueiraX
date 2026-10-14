<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261014223000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Trocar a data de publicação da plataforma pela data do download nos vídeos ainda não editados';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            UPDATE media_item
            SET
                metadata = JSON_SET(
                    metadata,
                    '$.data', DATE_FORMAT(criado_em, '%Y-%m-%d %H:%i:%s'),
                    '$.horario', DATE_FORMAT(criado_em, '%H:%i')
                ),
                data_exibicao = criado_em
            WHERE origem IN ('download', 'bot_telegram')
              AND JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.data')) REGEXP '^[0-9]{8}$'
              AND JSON_EXTRACT(metadata, '$.franky_id') IS NULL
              AND JSON_EXTRACT(metadata, '$.importado_franky') IS NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
    }
}
