<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261010215918 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Cadastrar categorias padrão (Print Empresa, Print Pessoal, videos/memes, Shingeki no Kyojin) e regras de origem iniciais';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            INSERT INTO categoria (uuid, nome, pasta_local, criado_em, atualizado_em)
            SELECT UNHEX(REPLACE(UUID(), '-', '')), 'Print Empresa', 'prints/empresa', NOW(), NOW()
            FROM DUAL
            WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nome = 'Print Empresa')
        SQL);

        $this->addSql(<<<'SQL'
            INSERT INTO categoria (uuid, nome, pasta_local, criado_em, atualizado_em)
            SELECT UNHEX(REPLACE(UUID(), '-', '')), 'Print Pessoal', 'prints/pessoal', NOW(), NOW()
            FROM DUAL
            WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nome = 'Print Pessoal')
        SQL);

        $this->addSql(<<<'SQL'
            INSERT INTO categoria (uuid, nome, pasta_local, criado_em, atualizado_em)
            SELECT UNHEX(REPLACE(UUID(), '-', '')), 'videos/memes', 'videos-memes', NOW(), NOW()
            FROM DUAL
            WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nome = 'videos/memes')
        SQL);

        $this->addSql(<<<'SQL'
            INSERT INTO categoria (uuid, nome, pasta_local, criado_em, atualizado_em)
            SELECT UNHEX(REPLACE(UUID(), '-', '')), 'Shingeki no Kyojin', 'videos/shingeki', NOW(), NOW()
            FROM DUAL
            WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nome = 'Shingeki no Kyojin')
        SQL);

        $this->addSql(<<<'SQL'
            INSERT INTO origem_regra (uuid, origem, categoria_id, criado_em, atualizado_em)
            SELECT UNHEX(REPLACE(UUID(), '-', '')), 'print_empresa', LOWER(CONCAT(
                SUBSTR(HEX(c.uuid), 1, 8), '-',
                SUBSTR(HEX(c.uuid), 9, 4), '-',
                SUBSTR(HEX(c.uuid), 13, 4), '-',
                SUBSTR(HEX(c.uuid), 17, 4), '-',
                SUBSTR(HEX(c.uuid), 21, 12)
            )), NOW(), NOW()
            FROM categoria c
            WHERE c.nome = 'Print Empresa'
            AND NOT EXISTS (SELECT 1 FROM origem_regra WHERE origem = 'print_empresa')
        SQL);

        $this->addSql(<<<'SQL'
            INSERT INTO origem_regra (uuid, origem, categoria_id, criado_em, atualizado_em)
            SELECT UNHEX(REPLACE(UUID(), '-', '')), 'print_pessoal', LOWER(CONCAT(
                SUBSTR(HEX(c.uuid), 1, 8), '-',
                SUBSTR(HEX(c.uuid), 9, 4), '-',
                SUBSTR(HEX(c.uuid), 13, 4), '-',
                SUBSTR(HEX(c.uuid), 17, 4), '-',
                SUBSTR(HEX(c.uuid), 21, 12)
            )), NOW(), NOW()
            FROM categoria c
            WHERE c.nome = 'Print Pessoal'
            AND NOT EXISTS (SELECT 1 FROM origem_regra WHERE origem = 'print_pessoal')
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql("DELETE FROM categoria WHERE nome = 'Shingeki no Kyojin'");
    }
}
