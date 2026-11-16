<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261116130140 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Torna artista_catalogo, musica_catalogo, alias_artista_catalogo e vinculo_musica_spotify compartilhados entre usuários';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE alias_artista_catalogo DROP FOREIGN KEY FK_22663C48DB38439E');
        $this->addSql('DROP INDEX UNIQ_ALIAS_ARTISTA_CATALOGO_USUARIO_ALIAS ON alias_artista_catalogo');
        $this->addSql('DROP INDEX IDX_22663C48DB38439E ON alias_artista_catalogo');
        $this->addSql('ALTER TABLE alias_artista_catalogo DROP usuario_id');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_ALIAS_ARTISTA_CATALOGO_ALIAS ON alias_artista_catalogo (alias_normalizado)');
        $this->addSql('ALTER TABLE artista_catalogo DROP FOREIGN KEY FK_A382F726DB38439E');
        $this->addSql('DROP INDEX UNIQ_ARTISTA_CATALOGO_USUARIO_NOME ON artista_catalogo');
        $this->addSql('DROP INDEX IDX_A382F726DB38439E ON artista_catalogo');
        $this->addSql('ALTER TABLE artista_catalogo DROP usuario_id');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_ARTISTA_CATALOGO_NOME ON artista_catalogo (nome_normalizado)');
        $this->addSql('ALTER TABLE musica_catalogo DROP FOREIGN KEY FK_6D9C0A0FDB38439E');
        $this->addSql('DROP INDEX UNIQ_MUSICA_CATALOGO_USUARIO_CHAVE ON musica_catalogo');
        $this->addSql('DROP INDEX IDX_6D9C0A0FDB38439E ON musica_catalogo');
        $this->addSql('ALTER TABLE musica_catalogo DROP usuario_id');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_MUSICA_CATALOGO_CHAVE ON musica_catalogo (chave_normalizada)');
        $this->addSql('ALTER TABLE vinculo_musica_spotify DROP FOREIGN KEY FK_DD96B77DDB38439E');
        $this->addSql('DROP INDEX IDX_DD96B77DDB38439E ON vinculo_musica_spotify');
        $this->addSql('DROP INDEX UNIQ_VINCULO_MUSICA_SPOTIFY_IDENTIDADE ON vinculo_musica_spotify');
        $this->addSql('ALTER TABLE vinculo_musica_spotify DROP usuario_id');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_VINCULO_MUSICA_SPOTIFY_IDENTIDADE ON vinculo_musica_spotify (nome_normalizado, artista_normalizado)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_ALIAS_ARTISTA_CATALOGO_ALIAS ON alias_artista_catalogo');
        $this->addSql('ALTER TABLE alias_artista_catalogo ADD usuario_id INT NOT NULL');
        $this->addSql('ALTER TABLE alias_artista_catalogo ADD CONSTRAINT FK_22663C48DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON UPDATE NO ACTION ON DELETE CASCADE');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_ALIAS_ARTISTA_CATALOGO_USUARIO_ALIAS ON alias_artista_catalogo (usuario_id, alias_normalizado)');
        $this->addSql('CREATE INDEX IDX_22663C48DB38439E ON alias_artista_catalogo (usuario_id)');
        $this->addSql('DROP INDEX UNIQ_ARTISTA_CATALOGO_NOME ON artista_catalogo');
        $this->addSql('ALTER TABLE artista_catalogo ADD usuario_id INT NOT NULL');
        $this->addSql('ALTER TABLE artista_catalogo ADD CONSTRAINT FK_A382F726DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON UPDATE NO ACTION ON DELETE CASCADE');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_ARTISTA_CATALOGO_USUARIO_NOME ON artista_catalogo (usuario_id, nome_normalizado)');
        $this->addSql('CREATE INDEX IDX_A382F726DB38439E ON artista_catalogo (usuario_id)');
        $this->addSql('DROP INDEX UNIQ_MUSICA_CATALOGO_CHAVE ON musica_catalogo');
        $this->addSql('ALTER TABLE musica_catalogo ADD usuario_id INT NOT NULL');
        $this->addSql('ALTER TABLE musica_catalogo ADD CONSTRAINT FK_6D9C0A0FDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON UPDATE NO ACTION ON DELETE CASCADE');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_MUSICA_CATALOGO_USUARIO_CHAVE ON musica_catalogo (usuario_id, chave_normalizada)');
        $this->addSql('CREATE INDEX IDX_6D9C0A0FDB38439E ON musica_catalogo (usuario_id)');
        $this->addSql('DROP INDEX UNIQ_VINCULO_MUSICA_SPOTIFY_IDENTIDADE ON vinculo_musica_spotify');
        $this->addSql('ALTER TABLE vinculo_musica_spotify ADD usuario_id INT NOT NULL');
        $this->addSql('ALTER TABLE vinculo_musica_spotify ADD CONSTRAINT FK_DD96B77DDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON UPDATE NO ACTION ON DELETE CASCADE');
        $this->addSql('CREATE INDEX IDX_DD96B77DDB38439E ON vinculo_musica_spotify (usuario_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_VINCULO_MUSICA_SPOTIFY_IDENTIDADE ON vinculo_musica_spotify (usuario_id, nome_normalizado, artista_normalizado)');
    }
}
