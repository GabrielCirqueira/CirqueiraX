<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\ModoSincronizacaoPlaylist;
use App\Repository\VinculoPlaylistRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: VinculoPlaylistRepository::class)]
#[ORM\Table(name: 'vinculo_playlist')]
#[ORM\UniqueConstraint(name: 'UNIQ_VINCULO_PLAYLIST_USUARIO_IDS', fields: ['usuario', 'idSpotify', 'idYoutube'])]
#[ORM\Index(name: 'IDX_VINCULO_PLAYLIST_USUARIO', fields: ['usuario'])]
class VinculoPlaylist
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 128)]
    private string $idSpotify;

    #[ORM\Column(type: 'string', length: 512)]
    private string $nomeSpotify;

    #[ORM\Column(type: 'string', length: 128, nullable: true)]
    private ?string $snapshotIdSpotify = null;

    #[ORM\Column(type: 'string', length: 128)]
    private string $idYoutube;

    #[ORM\Column(type: 'string', length: 512)]
    private string $nomeYoutube;

    #[ORM\Column(type: 'string', length: 40, enumType: ModoSincronizacaoPlaylist::class)]
    private ModoSincronizacaoPlaylist $modo;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $fotoEstadoJson = null;

    #[ORM\Column(type: 'boolean')]
    private bool $ativo = true;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $ultimaSincronizacaoEm = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $atualizadoEm;

    /** @var Collection<int, ItemVinculoPlaylist> */
    #[ORM\OneToMany(targetEntity: ItemVinculoPlaylist::class, mappedBy: 'vinculo', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $itens;

    public function __construct(
        Usuario $usuario,
        string $idSpotify,
        string $nomeSpotify,
        string $idYoutube,
        string $nomeYoutube,
        ModoSincronizacaoPlaylist $modo,
        ?string $snapshotIdSpotify = null,
    ) {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->idSpotify = $idSpotify;
        $this->nomeSpotify = $nomeSpotify;
        $this->snapshotIdSpotify = $snapshotIdSpotify;
        $this->idYoutube = $idYoutube;
        $this->nomeYoutube = $nomeYoutube;
        $this->modo = $modo;
        $this->criadoEm = new DateTimeImmutable();
        $this->atualizadoEm = new DateTimeImmutable();
        $this->itens = new ArrayCollection();
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function idSpotify(): string
    {
        return $this->idSpotify;
    }

    public function nomeSpotify(): string
    {
        return $this->nomeSpotify;
    }

    public function snapshotIdSpotify(): ?string
    {
        return $this->snapshotIdSpotify;
    }

    public function idYoutube(): string
    {
        return $this->idYoutube;
    }

    public function nomeYoutube(): string
    {
        return $this->nomeYoutube;
    }

    public function modo(): ModoSincronizacaoPlaylist
    {
        return $this->modo;
    }

    public function fotoEstadoJson(): ?string
    {
        return $this->fotoEstadoJson;
    }

    public function isAtivo(): bool
    {
        return $this->ativo;
    }

    public function ultimaSincronizacaoEm(): ?DateTimeImmutable
    {
        return $this->ultimaSincronizacaoEm;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function atualizadoEm(): DateTimeImmutable
    {
        return $this->atualizadoEm;
    }

    /**
     * @return Collection<int, ItemVinculoPlaylist>
     */
    public function itens(): Collection
    {
        return $this->itens;
    }

    public function adicionarItem(ItemVinculoPlaylist $item): self
    {
        if (!$this->itens->contains($item)) {
            $this->itens->add($item);
        }

        return $this;
    }

    public function atualizarNomes(string $nomeSpotify, string $nomeYoutube, ?string $snapshotIdSpotify = null): self
    {
        $this->nomeSpotify = $nomeSpotify;
        $this->nomeYoutube = $nomeYoutube;
        if (null !== $snapshotIdSpotify) {
            $this->snapshotIdSpotify = $snapshotIdSpotify;
        }
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function registrarSincronizacao(string $fotoEstadoJson): self
    {
        $this->fotoEstadoJson = $fotoEstadoJson;
        $this->ultimaSincronizacaoEm = new DateTimeImmutable();
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function desativar(): self
    {
        $this->ativo = false;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function ativar(): self
    {
        $this->ativo = true;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }
}
