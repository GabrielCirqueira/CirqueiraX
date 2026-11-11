<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\MusicaArtistaCatalogoRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: MusicaArtistaCatalogoRepository::class)]
#[ORM\Table(name: 'musica_artista_catalogo')]
#[ORM\UniqueConstraint(name: 'UNIQ_MUSICA_ARTISTA_CATALOGO', fields: ['musica', 'artista'])]
class MusicaArtistaCatalogo
{
    public const int POSICAO_PRINCIPAL = 0;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: MusicaCatalogo::class, inversedBy: 'artistas')]
    #[ORM\JoinColumn(name: 'musica_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private MusicaCatalogo $musica;

    #[ORM\ManyToOne(targetEntity: ArtistaCatalogo::class)]
    #[ORM\JoinColumn(name: 'artista_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private ArtistaCatalogo $artista;

    #[ORM\Column(type: 'smallint')]
    private int $posicao;

    public function __construct(MusicaCatalogo $musica, ArtistaCatalogo $artista, int $posicao)
    {
        $this->uuid = Uuid::v7();
        $this->musica = $musica;
        $this->artista = $artista;
        $this->posicao = $posicao;
    }

    public function reposicionar(int $posicao): self
    {
        $this->posicao = $posicao;

        return $this;
    }

    public function isPrincipal(): bool
    {
        return self::POSICAO_PRINCIPAL === $this->posicao;
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function musica(): MusicaCatalogo
    {
        return $this->musica;
    }

    public function artista(): ArtistaCatalogo
    {
        return $this->artista;
    }

    public function posicao(): int
    {
        return $this->posicao;
    }
}
