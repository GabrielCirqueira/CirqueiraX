<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261113181247 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Pool de IA: estado de cada provedor (bloqueios e totais) e provedor registrado no consumo de IA.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE estado_provedor_ia (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', provedor VARCHAR(30) NOT NULL, bloqueado_ate DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', motivo_bloqueio VARCHAR(255) DEFAULT NULL, limites_seguidos INT NOT NULL, falhas_seguidas INT NOT NULL, total_sucessos INT NOT NULL, total_falhas INT NOT NULL, ultimo_sucesso_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', ultima_falha_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_ESTADO_PROVEDOR_IA_PROVEDOR (provedor), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE consumo_ia ADD provedor VARCHAR(30) DEFAULT NULL');
        $this->addSql("UPDATE consumo_ia SET provedor = 'openai'");
        $this->addSql("INSERT INTO estado_provedor_ia (uuid, provedor, limites_seguidos, falhas_seguidas, total_sucessos, total_falhas) VALUES (UUID_TO_BIN(UUID()), 'groq', 0, 0, 0, 0), (UUID_TO_BIN(UUID()), 'gemini', 0, 0, 0, 0), (UUID_TO_BIN(UUID()), 'mistral', 0, 0, 0, 0), (UUID_TO_BIN(UUID()), 'openrouter', 0, 0, 0, 0), (UUID_TO_BIN(UUID()), 'cloudflare', 0, 0, 0, 0), (UUID_TO_BIN(UUID()), 'nvidia', 0, 0, 0, 0), (UUID_TO_BIN(UUID()), 'zai', 0, 0, 0, 0), (UUID_TO_BIN(UUID()), 'openai', 0, 0, 0, 0)");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE estado_provedor_ia');
        $this->addSql('ALTER TABLE consumo_ia DROP provedor');
    }
}
