<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261111164509 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE consumo_ia (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT DEFAULT NULL, finalidade VARCHAR(40) NOT NULL, modelo VARCHAR(80) NOT NULL, tokens_entrada INT NOT NULL, tokens_saida INT NOT NULL, custo_microdolares INT NOT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_CONSUMO_IA_USUARIO_CRIADO (usuario_id, criado_em), INDEX IDX_CONSUMO_IA_FINALIDADE_CRIADO (finalidade, criado_em), INDEX IDX_F203C139DB38439E (usuario_id), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE consumo_ia ADD CONSTRAINT FK_F203C139DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE consumo_ia DROP FOREIGN KEY FK_F203C139DB38439E');
        $this->addSql('DROP TABLE consumo_ia');
    }
}
