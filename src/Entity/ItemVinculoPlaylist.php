<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\ItemVinculoPlaylistRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ItemVinculoPlaylistRepository::class)]
#[ORM\Table(name: 'item_vinculo_playlist')]
#[ORM\Index(name: 'IDX_ITEM_VINCULO_PLAYLIST_VINCULO', fields: ['vinculo'])]
class ItemVinculoPlaylist
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: VinculoPlaylist::class, inversedBy: 'itens')]
    #[ORM\JoinColumn(name: 'vinculo_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private VinculoPlaylist $vinculo;

    #[ORM\Column(type: 'string', length: 128, nullable: true)]
    private ?string $idFaixaSpotify = null;

    #[ORM\Column(type: 'string', length: 128, nullable: true)]
    private ?string $idVideoYoutube = null;

    #[ORM\Column(type: 'string', length: 128, nullable: true)]
    private ?string $idItemPlaylistYoutube = null;

    #[ORM\ManyToOne(targetEntity: MusicaCatalogo::class)]
    #[ORM\JoinColumn(name: 'musica_catalogo_uuid', referencedColumnName: 'uuid', nullable: true, onDelete: 'SET NULL')]
    private ?MusicaCatalogo $musicaCatalogo = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    public function __construct(
        VinculoPlaylist $vinculo,
        ?string $idFaixaSpotify = null,
        ?string $idVideoYoutube = null,
        ?string $idItemPlaylistYoutube = null,
        ?MusicaCatalogo $musicaCatalogo = null,
    ) {
        $this->uuid = Uuid::v7();
        $this->vinculo = $vinculo;
        $this->idFaixaSpotify = $idFaixaSpotify;
        $this->idVideoYoutube = $idVideoYoutube;
        $this->idItemPlaylistYoutube = $idItemPlaylistYoutube;
        $this->musicaCatalogo = $musicaCatalogo;
        $this->criadoEm = new DateTimeImmutable();
        $vinculo->adicionarItem($this);
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function vinculo(): VinculoPlaylist
    {
        return $this->vinculo;
    }

    public function idFaixaSpotify(): ?string
    {
        return $this->idFaixaSpotify;
    }

    public function idVideoYoutube(): ?string
    {
        return $this->idVideoYoutube;
    }

    public function idItemPlaylistYoutube(): ?string
    {
        return $this->idItemPlaylistYoutube;
    }

    public function musicaCatalogo(): ?MusicaCatalogo
    {
        return $this->musicaCatalogo;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }
}
