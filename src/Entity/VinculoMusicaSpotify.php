<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\VinculoMusicaSpotifyRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: VinculoMusicaSpotifyRepository::class)]
#[ORM\Table(name: 'vinculo_musica_spotify')]
#[ORM\UniqueConstraint(name: 'UNIQ_VINCULO_MUSICA_SPOTIFY_IDENTIDADE', fields: ['usuario', 'nomeNormalizado', 'artistaNormalizado'])]
class VinculoMusicaSpotify
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 255)]
    private string $nomeNormalizado;

    #[ORM\Column(type: 'string', length: 255)]
    private string $artistaNormalizado;

    #[ORM\ManyToOne(targetEntity: MusicaCatalogo::class)]
    #[ORM\JoinColumn(name: 'musica_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private MusicaCatalogo $musica;

    #[ORM\Column(type: 'boolean')]
    private bool $manual = false;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    public function __construct(Usuario $usuario, string $nomeNormalizado, string $artistaNormalizado, MusicaCatalogo $musica)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->nomeNormalizado = $nomeNormalizado;
        $this->artistaNormalizado = $artistaNormalizado;
        $this->musica = $musica;
        $this->criadoEm = new DateTimeImmutable();
    }

    public function religarManualmente(MusicaCatalogo $musica): self
    {
        $this->musica = $musica;
        $this->manual = true;

        return $this;
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function nomeNormalizado(): string
    {
        return $this->nomeNormalizado;
    }

    public function artistaNormalizado(): string
    {
        return $this->artistaNormalizado;
    }

    public function musica(): MusicaCatalogo
    {
        return $this->musica;
    }

    public function isManual(): bool
    {
        return $this->manual;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }
}
