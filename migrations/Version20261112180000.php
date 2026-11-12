<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261112180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Liga cada reprodução do YouTube à importação do Takeout que a trouxe e guarda quando o relatório da importação foi visto.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE importacao_youtube ADD relatorio_visto_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE reproducao_youtube ADD importacao_youtube_uuid BINARY(16) DEFAULT NULL COMMENT \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE reproducao_youtube ADD CONSTRAINT FK_606158F12D368AED FOREIGN KEY (importacao_youtube_uuid) REFERENCES importacao_youtube (uuid) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_REPRODUCAO_YOUTUBE_IMPORTACAO ON reproducao_youtube (importacao_youtube_uuid)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reproducao_youtube DROP FOREIGN KEY FK_606158F12D368AED');
        $this->addSql('DROP INDEX IDX_REPRODUCAO_YOUTUBE_IMPORTACAO ON reproducao_youtube');
        $this->addSql('ALTER TABLE reproducao_youtube DROP importacao_youtube_uuid');
        $this->addSql('ALTER TABLE importacao_youtube DROP relatorio_visto_em');
    }
}
