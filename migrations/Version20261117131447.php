<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261117131447 extends AbstractMigration
{
    public function isTransactional(): bool
    {
        return false;
    }

    public function getDescription(): string
    {
        return 'Adiciona permissões por funcionalidade em usuario e promove o administrador principal';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE usuario ADD permissoes JSON DEFAULT NULL');
        $this->addSql(<<<'SQL'
            UPDATE usuario
            SET permissoes = JSON_ARRAY(
                'dashboard',
                'musica',
                'central_midias',
                'downloads_video',
                'downloads_audio',
                'livros_audio',
                'transcricoes',
                'prints',
                'editor_imagem',
                'extrair_texto',
                'upload_manual',
                'google_fotos'
            )
            WHERE email <> 'gabrielcirqueira711@gmail.com'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE usuario
            SET roles = JSON_ARRAY('ROLE_ADMIN', 'ROLE_USER'),
                permissoes = JSON_ARRAY()
            WHERE email = 'gabrielcirqueira711@gmail.com'
        SQL);
        $this->addSql("UPDATE usuario SET permissoes = JSON_ARRAY() WHERE permissoes IS NULL");
        $this->addSql('ALTER TABLE usuario MODIFY permissoes JSON NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE usuario DROP permissoes');
    }
}
