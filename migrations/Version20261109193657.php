<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261109193657 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adiciona origem em vídeo e correção do texto com IA nas transcrições';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE transcricao ADD origem_video TINYINT(1) DEFAULT 0 NOT NULL, ADD texto_corrigido LONGTEXT DEFAULT NULL, ADD status_correcao VARCHAR(20) DEFAULT NULL, ADD erro_correcao LONGTEXT DEFAULT NULL, ADD corrigido_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE transcricao DROP origem_video, DROP texto_corrigido, DROP status_correcao, DROP erro_correcao, DROP corrigido_em');
    }
}
