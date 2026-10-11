<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261011211214 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Unificar categoria e pasta de prints em "Prints" (prints/) e cadastrar categoria "One Piece" (videos/onepiece)';
    }

    public function up(Schema $schema): void
    {
        // 1. Criar categoria única Prints (prints/) se não existir
        $this->addSql(<<<'SQL'
            INSERT INTO categoria (uuid, nome, pasta_local, criado_em, atualizado_em)
            SELECT UNHEX(REPLACE(UUID(), '-', '')), 'Prints', 'prints', NOW(), NOW()
            FROM DUAL
            WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nome = 'Prints')
        SQL);

        // 2. Criar categoria One Piece (videos/onepiece) se não existir
        $this->addSql(<<<'SQL'
            INSERT INTO categoria (uuid, nome, pasta_local, criado_em, atualizado_em)
            SELECT UNHEX(REPLACE(UUID(), '-', '')), 'One Piece', 'videos/onepiece', NOW(), NOW()
            FROM DUAL
            WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nome = 'One Piece')
        SQL);

        // 3. Normalizar pasta local de videos/memes para videos/memes
        $this->addSql(<<<'SQL'
            UPDATE categoria
            SET pasta_local = 'videos/memes'
            WHERE nome = 'videos/memes'
        SQL);

        // 4. Migrar media_item antigos vinculados a Print Empresa ou Print Pessoal para a nova Prints
        $this->addSql(<<<'SQL'
            UPDATE media_item m
            JOIN (
                SELECT LOWER(CONCAT(
                    SUBSTR(HEX(uuid), 1, 8), '-',
                    SUBSTR(HEX(uuid), 9, 4), '-',
                    SUBSTR(HEX(uuid), 13, 4), '-',
                    SUBSTR(HEX(uuid), 17, 4), '-',
                    SUBSTR(HEX(uuid), 21, 12)
                )) AS old_uuid_str
                FROM categoria
                WHERE nome IN ('Print Empresa', 'Print Pessoal')
            ) old_cat ON m.categoria_id = old_cat.old_uuid_str
            CROSS JOIN (
                SELECT LOWER(CONCAT(
                    SUBSTR(HEX(uuid), 1, 8), '-',
                    SUBSTR(HEX(uuid), 9, 4), '-',
                    SUBSTR(HEX(uuid), 13, 4), '-',
                    SUBSTR(HEX(uuid), 17, 4), '-',
                    SUBSTR(HEX(uuid), 21, 12)
                )) AS new_uuid_str
                FROM categoria
                WHERE nome = 'Prints'
                LIMIT 1
            ) new_cat
            SET m.categoria_id = new_cat.new_uuid_str
        SQL);

        // 5. Apontar regras de origem print_empresa e print_pessoal para a categoria Prints
        $this->addSql(<<<'SQL'
            UPDATE origem_regra o
            CROSS JOIN (
                SELECT LOWER(CONCAT(
                    SUBSTR(HEX(uuid), 1, 8), '-',
                    SUBSTR(HEX(uuid), 9, 4), '-',
                    SUBSTR(HEX(uuid), 13, 4), '-',
                    SUBSTR(HEX(uuid), 17, 4), '-',
                    SUBSTR(HEX(uuid), 21, 12)
                )) AS prints_uuid_str
                FROM categoria
                WHERE nome = 'Prints'
                LIMIT 1
            ) c
            SET o.categoria_id = c.prints_uuid_str
            WHERE o.origem IN ('print_empresa', 'print_pessoal')
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
            WHERE c.nome = 'Prints'
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
            WHERE c.nome = 'Prints'
            AND NOT EXISTS (SELECT 1 FROM origem_regra WHERE origem = 'print_pessoal')
        SQL);

        // 6. Remover categorias duplicadas antigas
        $this->addSql(<<<'SQL'
            DELETE FROM categoria WHERE nome IN ('Print Empresa', 'Print Pessoal')
        SQL);

        // 7. Atualizar caminho_local dos itens existentes no banco
        $this->addSql(<<<'SQL'
            UPDATE media_item
            SET caminho_local = REPLACE(caminho_local, '/prints/pessoal/', '/prints/')
            WHERE caminho_local LIKE '%/prints/pessoal/%'
        SQL);

        $this->addSql(<<<'SQL'
            UPDATE media_item
            SET caminho_local = REPLACE(caminho_local, '/prints/empresa/', '/prints/')
            WHERE caminho_local LIKE '%/prints/empresa/%'
        SQL);

        $this->addSql(<<<'SQL'
            UPDATE media_item
            SET caminho_local = REPLACE(caminho_local, '/videos-memes/', '/videos/memes/')
            WHERE caminho_local LIKE '%/videos-memes/%'
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql("DELETE FROM categoria WHERE nome = 'One Piece'");
    }
}
