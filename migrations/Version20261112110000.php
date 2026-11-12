<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261112110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Cria a tabela de notificações de atualização do sistema.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE notificacao (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, tipo VARCHAR(20) NOT NULL, titulo VARCHAR(160) NOT NULL, mensagem LONGTEXT NOT NULL, lida_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_NOTIFICACAO_USUARIO_CRIADO (usuario_id, criado_em), INDEX IDX_NOTIFICACAO_USUARIO_LIDA (usuario_id, lida_em), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE notificacao ADD CONSTRAINT FK_NOTIFICACAO_USUARIO FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE notificacao DROP FOREIGN KEY FK_NOTIFICACAO_USUARIO');
        $this->addSql('DROP TABLE notificacao');
    }
}
