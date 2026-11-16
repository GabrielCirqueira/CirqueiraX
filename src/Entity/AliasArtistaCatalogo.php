<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\AliasArtistaCatalogoRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: AliasArtistaCatalogoRepository::class)]
#[ORM\Table(name: 'alias_artista_catalogo')]
#[ORM\UniqueConstraint(name: 'UNIQ_ALIAS_ARTISTA_CATALOGO_ALIAS', fields: ['aliasNormalizado'])]
class AliasArtistaCatalogo
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: ArtistaCatalogo::class)]
    #[ORM\JoinColumn(name: 'artista_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private ArtistaCatalogo $artista;

    #[ORM\Column(type: 'string', length: 255)]
    private string $aliasNormalizado;

    public function __construct(ArtistaCatalogo $artista, string $aliasNormalizado)
    {
        $this->uuid = Uuid::v7();
        $this->artista = $artista;
        $this->aliasNormalizado = $aliasNormalizado;
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function artista(): ArtistaCatalogo
    {
        return $this->artista;
    }

    public function aliasNormalizado(): string
    {
        return $this->aliasNormalizado;
    }
}
