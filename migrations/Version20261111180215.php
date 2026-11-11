<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261111180215 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE importacao_youtube ADD etapa VARCHAR(20) NOT NULL, ADD primeira_reproducao_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', ADD ultima_reproducao_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', ADD total_descartados_regra INT NOT NULL, ADD total_indisponiveis INT NOT NULL, ADD total_sem_ia INT NOT NULL, ADD total_para_ia INT NOT NULL, ADD total_classificados INT NOT NULL, ADD tokens_entrada_estimados INT NOT NULL, ADD tokens_saida_estimados INT NOT NULL, ADD custo_estimado_microdolares BIGINT NOT NULL, ADD tokens_entrada_reais INT NOT NULL, ADD tokens_saida_reais INT NOT NULL, ADD custo_real_microdolares BIGINT NOT NULL, ADD classificacao_iniciada_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', ADD confirmada_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', ADD tempo_calculado_ate DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', ADD relatorio JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE importacao_youtube DROP etapa, DROP primeira_reproducao_em, DROP ultima_reproducao_em, DROP total_descartados_regra, DROP total_indisponiveis, DROP total_sem_ia, DROP total_para_ia, DROP total_classificados, DROP tokens_entrada_estimados, DROP tokens_saida_estimados, DROP custo_estimado_microdolares, DROP tokens_entrada_reais, DROP tokens_saida_reais, DROP custo_real_microdolares, DROP classificacao_iniciada_em, DROP confirmada_em, DROP tempo_calculado_ate, DROP relatorio');
    }
}
