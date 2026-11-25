<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261125222756 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Cria as tabelas do módulo Inglês & Pronúncia: dicionário, exceções revisadas, frases, histórico e relatos de erro';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE consulta_pronuncia (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT NOT NULL, frase_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', favorita TINYINT(1) NOT NULL, vezes_consultada INT NOT NULL, criada_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', ultima_consulta_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_CONSULTA_PRONUNCIA_USUARIO_ULTIMA (usuario_id, ultima_consulta_em), UNIQUE INDEX UNIQ_CONSULTA_PRONUNCIA_USUARIO_FRASE (usuario_id, frase_uuid), INDEX IDX_AA59F9AEDB38439E (usuario_id), INDEX IDX_AA59F9AE32A6D4C8 (frase_uuid), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE excecao_pronuncia (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', palavra VARCHAR(80) NOT NULL, pronuncia VARCHAR(120) NOT NULL, observacao VARCHAR(255) DEFAULT NULL, origem VARCHAR(20) NOT NULL, criada_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizada_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_EXCECAO_PRONUNCIA_PALAVRA (palavra), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE frase_pronuncia (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', hash_origem VARCHAR(64) NOT NULL, idioma_origem VARCHAR(2) NOT NULL, texto_portugues LONGTEXT NOT NULL, texto_ingles LONGTEXT NOT NULL, analise JSON NOT NULL, palavras_indexadas LONGTEXT NOT NULL, status VARCHAR(20) NOT NULL, total_consultas INT NOT NULL, criada_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', atualizada_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_FRASE_PRONUNCIA_STATUS (status), UNIQUE INDEX UNIQ_FRASE_PRONUNCIA_HASH (hash_origem), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE palavra_dicionario_pronuncia (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', palavra VARCHAR(80) NOT NULL, variante SMALLINT NOT NULL, fonemas VARCHAR(255) NOT NULL, UNIQUE INDEX UNIQ_PALAVRA_DICIONARIO_VARIANTE (palavra, variante), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE relato_erro_pronuncia (uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', frase_uuid BINARY(16) NOT NULL COMMENT \'(DC2Type:uuid)\', usuario_id INT DEFAULT NULL, tipo VARCHAR(20) NOT NULL, palavra VARCHAR(80) DEFAULT NULL, comentario VARCHAR(500) DEFAULT NULL, texto_ingles_antes LONGTEXT NOT NULL, pronuncia_antes LONGTEXT NOT NULL, sugestao_traducao LONGTEXT DEFAULT NULL, sugestao_palavras JSON NOT NULL, explicacao_sugestao LONGTEXT DEFAULT NULL, status VARCHAR(20) NOT NULL, criado_em DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', resolvido_em DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_RELATO_PRONUNCIA_STATUS_CRIADO (status, criado_em), INDEX IDX_9ECBDA6632A6D4C8 (frase_uuid), INDEX IDX_9ECBDA66DB38439E (usuario_id), PRIMARY KEY(uuid)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE consulta_pronuncia ADD CONSTRAINT FK_AA59F9AEDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE consulta_pronuncia ADD CONSTRAINT FK_AA59F9AE32A6D4C8 FOREIGN KEY (frase_uuid) REFERENCES frase_pronuncia (uuid) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE relato_erro_pronuncia ADD CONSTRAINT FK_9ECBDA6632A6D4C8 FOREIGN KEY (frase_uuid) REFERENCES frase_pronuncia (uuid) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE relato_erro_pronuncia ADD CONSTRAINT FK_9ECBDA66DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE consulta_pronuncia DROP FOREIGN KEY FK_AA59F9AEDB38439E');
        $this->addSql('ALTER TABLE consulta_pronuncia DROP FOREIGN KEY FK_AA59F9AE32A6D4C8');
        $this->addSql('ALTER TABLE relato_erro_pronuncia DROP FOREIGN KEY FK_9ECBDA6632A6D4C8');
        $this->addSql('ALTER TABLE relato_erro_pronuncia DROP FOREIGN KEY FK_9ECBDA66DB38439E');
        $this->addSql('DROP TABLE consulta_pronuncia');
        $this->addSql('DROP TABLE excecao_pronuncia');
        $this->addSql('DROP TABLE frase_pronuncia');
        $this->addSql('DROP TABLE palavra_dicionario_pronuncia');
        $this->addSql('DROP TABLE relato_erro_pronuncia');
    }
}
