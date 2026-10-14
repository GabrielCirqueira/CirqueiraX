<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use App\Entity\MediaItem;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261014030100 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ordenar mídias pela data de exibição (download ou edição)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE media_item ADD data_exibicao DATETIME DEFAULT NULL');
        $this->addSql('UPDATE media_item SET data_exibicao = criado_em');
    }

    public function postUp(Schema $schema): void
    {
        $linhas = $this->connection->fetchAllAssociative('SELECT hash, metadata, criado_em FROM media_item');

        foreach ($linhas as $linha) {
            $metadata = json_decode((string) $linha['metadata'], true);
            if (!is_array($metadata)) {
                $metadata = [];
            }

            $fallback = new \DateTimeImmutable((string) $linha['criado_em']);
            $dataExibicao = MediaItem::resolverDataExibicao($metadata, $fallback);

            $this->connection->executeStatement(
                'UPDATE media_item SET data_exibicao = ? WHERE hash = ?',
                [$dataExibicao->format('Y-m-d H:i:s'), $linha['hash']],
            );
        }

        $this->connection->executeStatement('ALTER TABLE media_item MODIFY data_exibicao DATETIME NOT NULL');
        $this->connection->executeStatement('CREATE INDEX IDX_MEDIA_ITEM_DATA_EXIBICAO ON media_item (data_exibicao)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IDX_MEDIA_ITEM_DATA_EXIBICAO ON media_item');
        $this->addSql('ALTER TABLE media_item DROP data_exibicao');
    }
}
