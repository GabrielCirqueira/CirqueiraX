<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261110151341 extends AbstractMigration
{
    private const string EMAIL_CONTA_PRINCIPAL = 'gabrielcirqueira711@gmail.com';

    public function getDescription(): string
    {
        return 'Dá dono (usuário) às mídias, categorias, regras de origem, conta do Google Fotos, envios e tokens de agente, vinculando os dados existentes à conta principal.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_CATEGORIA_NOME ON categoria');
        $this->addSql('ALTER TABLE categoria ADD usuario_id INT DEFAULT NULL');
        $this->addSql('UPDATE categoria SET usuario_id = (SELECT id FROM usuario WHERE email = :email)', ['email' => self::EMAIL_CONTA_PRINCIPAL]);
        $this->addSql('ALTER TABLE categoria MODIFY usuario_id INT NOT NULL');
        $this->addSql('ALTER TABLE categoria ADD CONSTRAINT FK_4E10122DDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_CATEGORIA_USUARIO_NOME ON categoria (usuario_id, nome)');
        $this->addSql('CREATE INDEX IDX_4E10122DDB38439E ON categoria (usuario_id)');
        $this->addSql('DROP INDEX UNIQ_CONTA_GOOGLE_FOTOS_EMAIL ON conta_google_fotos');
        $this->addSql('ALTER TABLE conta_google_fotos ADD usuario_id INT DEFAULT NULL');
        $this->addSql('UPDATE conta_google_fotos SET usuario_id = (SELECT id FROM usuario WHERE email = :email)', ['email' => self::EMAIL_CONTA_PRINCIPAL]);
        $this->addSql('ALTER TABLE conta_google_fotos MODIFY usuario_id INT NOT NULL');
        $this->addSql('ALTER TABLE conta_google_fotos ADD CONSTRAINT FK_5C463CFBDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_CONTA_GOOGLE_FOTOS_USUARIO ON conta_google_fotos (usuario_id)');
        $this->addSql('DROP INDEX UNIQ_MEDIA_ITEM_HASH ON media_item');
        $this->addSql('ALTER TABLE media_item ADD usuario_id INT DEFAULT NULL');
        $this->addSql('UPDATE media_item SET usuario_id = (SELECT id FROM usuario WHERE email = :email)', ['email' => self::EMAIL_CONTA_PRINCIPAL]);
        $this->addSql('ALTER TABLE media_item MODIFY usuario_id INT NOT NULL');
        $this->addSql('ALTER TABLE media_item ADD CONSTRAINT FK_DC5CFACDDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('CREATE INDEX IDX_MEDIA_ITEM_USUARIO_DATA_EXIBICAO ON media_item (usuario_id, data_exibicao)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_MEDIA_ITEM_USUARIO_HASH ON media_item (usuario_id, hash)');
        $this->addSql('CREATE INDEX IDX_DC5CFACDDB38439E ON media_item (usuario_id)');
        $this->addSql('DROP INDEX UNIQ_ORIGEM_REGRA_ORIGEM ON origem_regra');
        $this->addSql('ALTER TABLE origem_regra ADD usuario_id INT DEFAULT NULL');
        $this->addSql('UPDATE origem_regra SET usuario_id = (SELECT id FROM usuario WHERE email = :email)', ['email' => self::EMAIL_CONTA_PRINCIPAL]);
        $this->addSql('ALTER TABLE origem_regra MODIFY usuario_id INT NOT NULL');
        $this->addSql('ALTER TABLE origem_regra ADD CONSTRAINT FK_F8D107AADB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_ORIGEM_REGRA_USUARIO_ORIGEM ON origem_regra (usuario_id, origem)');
        $this->addSql('CREATE INDEX IDX_F8D107AADB38439E ON origem_regra (usuario_id)');
        $this->addSql('ALTER TABLE registro_envio_google_fotos ADD usuario_id INT DEFAULT NULL');
        $this->addSql('UPDATE registro_envio_google_fotos SET usuario_id = (SELECT id FROM usuario WHERE email = :email)', ['email' => self::EMAIL_CONTA_PRINCIPAL]);
        $this->addSql('ALTER TABLE registro_envio_google_fotos MODIFY usuario_id INT NOT NULL');
        $this->addSql('ALTER TABLE registro_envio_google_fotos ADD CONSTRAINT FK_5E97444DDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('CREATE INDEX IDX_5E97444DDB38439E ON registro_envio_google_fotos (usuario_id)');
        $this->addSql('ALTER TABLE token_agente ADD usuario_id INT DEFAULT NULL');
        $this->addSql('UPDATE token_agente SET usuario_id = (SELECT id FROM usuario WHERE email = :email)', ['email' => self::EMAIL_CONTA_PRINCIPAL]);
        $this->addSql('ALTER TABLE token_agente MODIFY usuario_id INT NOT NULL');
        $this->addSql('ALTER TABLE token_agente ADD CONSTRAINT FK_603AB13DDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('CREATE INDEX IDX_603AB13DDB38439E ON token_agente (usuario_id)');
        $this->addSql('ALTER TABLE usuario ADD pasta_armazenamento VARCHAR(150) DEFAULT NULL');
        $this->addSql("UPDATE usuario SET pasta_armazenamento = '', roles = JSON_ARRAY('ROLE_USER', 'ROLE_ADMIN') WHERE email = :email", ['email' => self::EMAIL_CONTA_PRINCIPAL]);
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE categoria DROP FOREIGN KEY FK_4E10122DDB38439E');
        $this->addSql('DROP INDEX UNIQ_CATEGORIA_USUARIO_NOME ON categoria');
        $this->addSql('DROP INDEX IDX_4E10122DDB38439E ON categoria');
        $this->addSql('ALTER TABLE categoria DROP usuario_id');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_CATEGORIA_NOME ON categoria (nome)');
        $this->addSql('ALTER TABLE conta_google_fotos DROP FOREIGN KEY FK_5C463CFBDB38439E');
        $this->addSql('DROP INDEX UNIQ_CONTA_GOOGLE_FOTOS_USUARIO ON conta_google_fotos');
        $this->addSql('ALTER TABLE conta_google_fotos DROP usuario_id');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_CONTA_GOOGLE_FOTOS_EMAIL ON conta_google_fotos (email)');
        $this->addSql('ALTER TABLE media_item DROP FOREIGN KEY FK_DC5CFACDDB38439E');
        $this->addSql('DROP INDEX IDX_MEDIA_ITEM_USUARIO_DATA_EXIBICAO ON media_item');
        $this->addSql('DROP INDEX UNIQ_MEDIA_ITEM_USUARIO_HASH ON media_item');
        $this->addSql('DROP INDEX IDX_DC5CFACDDB38439E ON media_item');
        $this->addSql('ALTER TABLE media_item DROP usuario_id');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_MEDIA_ITEM_HASH ON media_item (hash)');
        $this->addSql('ALTER TABLE origem_regra DROP FOREIGN KEY FK_F8D107AADB38439E');
        $this->addSql('DROP INDEX UNIQ_ORIGEM_REGRA_USUARIO_ORIGEM ON origem_regra');
        $this->addSql('DROP INDEX IDX_F8D107AADB38439E ON origem_regra');
        $this->addSql('ALTER TABLE origem_regra DROP usuario_id');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_ORIGEM_REGRA_ORIGEM ON origem_regra (origem)');
        $this->addSql('ALTER TABLE registro_envio_google_fotos DROP FOREIGN KEY FK_5E97444DDB38439E');
        $this->addSql('DROP INDEX IDX_5E97444DDB38439E ON registro_envio_google_fotos');
        $this->addSql('ALTER TABLE registro_envio_google_fotos DROP usuario_id');
        $this->addSql('ALTER TABLE token_agente DROP FOREIGN KEY FK_603AB13DDB38439E');
        $this->addSql('DROP INDEX IDX_603AB13DDB38439E ON token_agente');
        $this->addSql('ALTER TABLE token_agente DROP usuario_id');
        $this->addSql('ALTER TABLE usuario DROP pasta_armazenamento');
    }
}
