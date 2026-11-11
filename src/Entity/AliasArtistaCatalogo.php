<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\AliasArtistaCatalogoRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: AliasArtistaCatalogoRepository::class)]
#[ORM\Table(name: 'alias_artista_catalogo')]
#[ORM\UniqueConstraint(name: 'UNIQ_ALIAS_ARTISTA_CATALOGO_USUARIO_ALIAS', fields: ['usuario', 'aliasNormalizado'])]
class AliasArtistaCatalogo
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\ManyToOne(targetEntity: ArtistaCatalogo::class)]
    #[ORM\JoinColumn(name: 'artista_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private ArtistaCatalogo $artista;

    #[ORM\Column(type: 'string', length: 255)]
    private string $aliasNormalizado;

    public function __construct(ArtistaCatalogo $artista, string $aliasNormalizado)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $artista->usuario();
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

    public function usuario(): Usuario
    {
        return $this->usuario;
    }
}
