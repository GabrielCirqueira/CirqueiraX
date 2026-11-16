<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\StatusItemTransferenciaPlaylist;
use App\Repository\ItemTransferenciaPlaylistRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ItemTransferenciaPlaylistRepository::class)]
#[ORM\Table(name: 'item_transferencia_playlist')]
#[ORM\Index(name: 'IDX_ITEM_TRANSF_PLAYLIST_TRANSFERENCIA', fields: ['transferencia'])]
#[ORM\Index(name: 'IDX_ITEM_TRANSF_PLAYLIST_STATUS', fields: ['status'])]
class ItemTransferenciaPlaylist
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: TransferenciaPlaylist::class, inversedBy: 'itens')]
    #[ORM\JoinColumn(name: 'transferencia_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private TransferenciaPlaylist $transferencia;

    #[ORM\ManyToOne(targetEntity: PlaylistTransferenciaSelecionada::class)]
    #[ORM\JoinColumn(name: 'playlist_selecionada_uuid', referencedColumnName: 'uuid', nullable: true, onDelete: 'SET NULL')]
    private ?PlaylistTransferenciaSelecionada $playlistSelecionada = null;

    #[ORM\Column(type: 'integer')]
    private int $ordem;

    #[ORM\Column(type: 'string', length: 128)]
    private string $idExternoOrigem;

    #[ORM\Column(type: 'string', length: 512)]
    private string $tituloOrigem;

    #[ORM\Column(type: 'string', length: 512)]
    private string $artistasOrigem;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $duracaoMsOrigem = null;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $urlCapaOrigem = null;

    #[ORM\Column(type: 'string', length: 128, nullable: true)]
    private ?string $idExternoDestino = null;

    #[ORM\Column(type: 'string', length: 512, nullable: true)]
    private ?string $tituloDestino = null;

    #[ORM\Column(type: 'string', length: 512, nullable: true)]
    private ?string $artistasDestino = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $pontuacao = null;

    #[ORM\Column(type: 'string', length: 30, enumType: StatusItemTransferenciaPlaylist::class)]
    private StatusItemTransferenciaPlaylist $status;

    #[ORM\ManyToOne(targetEntity: MusicaCatalogo::class)]
    #[ORM\JoinColumn(name: 'musica_catalogo_uuid', referencedColumnName: 'uuid', nullable: true, onDelete: 'SET NULL')]
    private ?MusicaCatalogo $musicaCatalogo = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    public function __construct(
        TransferenciaPlaylist $transferencia,
        int $ordem,
        string $idExternoOrigem,
        string $tituloOrigem,
        string $artistasOrigem,
        ?int $duracaoMsOrigem = null,
        ?string $urlCapaOrigem = null,
        ?PlaylistTransferenciaSelecionada $playlistSelecionada = null,
    ) {
        $this->uuid = Uuid::v7();
        $this->transferencia = $transferencia;
        $this->ordem = $ordem;
        $this->idExternoOrigem = $idExternoOrigem;
        $this->tituloOrigem = $tituloOrigem;
        $this->artistasOrigem = $artistasOrigem;
        $this->duracaoMsOrigem = $duracaoMsOrigem;
        $this->urlCapaOrigem = $urlCapaOrigem;
        $this->playlistSelecionada = $playlistSelecionada;
        $this->status = StatusItemTransferenciaPlaylist::Pendente;
        $this->criadoEm = new DateTimeImmutable();
        $transferencia->adicionarItem($this);
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function transferencia(): TransferenciaPlaylist
    {
        return $this->transferencia;
    }

    public function playlistSelecionada(): ?PlaylistTransferenciaSelecionada
    {
        return $this->playlistSelecionada;
    }

    public function ordem(): int
    {
        return $this->ordem;
    }

    public function idExternoOrigem(): string
    {
        return $this->idExternoOrigem;
    }

    public function tituloOrigem(): string
    {
        return $this->tituloOrigem;
    }

    public function artistasOrigem(): string
    {
        return $this->artistasOrigem;
    }

    public function duracaoMsOrigem(): ?int
    {
        return $this->duracaoMsOrigem;
    }

    public function urlCapaOrigem(): ?string
    {
        return $this->urlCapaOrigem;
    }

    public function idExternoDestino(): ?string
    {
        return $this->idExternoDestino;
    }

    public function tituloDestino(): ?string
    {
        return $this->tituloDestino;
    }

    public function artistasDestino(): ?string
    {
        return $this->artistasDestino;
    }

    public function pontuacao(): ?int
    {
        return $this->pontuacao;
    }

    public function status(): StatusItemTransferenciaPlaylist
    {
        return $this->status;
    }

    public function musicaCatalogo(): ?MusicaCatalogo
    {
        return $this->musicaCatalogo;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function marcarCasada(
        string $idExternoDestino,
        string $tituloDestino,
        string $artistasDestino,
        int $pontuacao,
        ?MusicaCatalogo $musicaCatalogo = null,
    ): self {
        $this->idExternoDestino = $idExternoDestino;
        $this->tituloDestino = $tituloDestino;
        $this->artistasDestino = $artistasDestino;
        $this->pontuacao = $pontuacao;
        $this->musicaCatalogo = $musicaCatalogo;
        $this->status = StatusItemTransferenciaPlaylist::Casada;

        return $this;
    }

    public function marcarDuvidosa(
        string $idExternoDestino,
        string $tituloDestino,
        string $artistasDestino,
        int $pontuacao,
        ?MusicaCatalogo $musicaCatalogo = null,
    ): self {
        $this->idExternoDestino = $idExternoDestino;
        $this->tituloDestino = $tituloDestino;
        $this->artistasDestino = $artistasDestino;
        $this->pontuacao = $pontuacao;
        $this->musicaCatalogo = $musicaCatalogo;
        $this->status = StatusItemTransferenciaPlaylist::Duvidosa;

        return $this;
    }

    public function marcarNaoEncontrada(): self
    {
        $this->status = StatusItemTransferenciaPlaylist::NaoEncontrada;

        return $this;
    }

    public function marcarIgnorada(): self
    {
        $this->status = StatusItemTransferenciaPlaylist::Ignorada;

        return $this;
    }

    public function marcarTransferida(): self
    {
        $this->status = StatusItemTransferenciaPlaylist::Transferida;

        return $this;
    }

    public function marcarFalha(): self
    {
        $this->status = StatusItemTransferenciaPlaylist::Falha;

        return $this;
    }

    public function aplicarConfirmacao(
        StatusItemTransferenciaPlaylist $status,
        ?string $idExternoDestino = null,
        ?string $tituloDestino = null,
        ?string $artistasDestino = null,
    ): self {
        $this->status = $status;
        if (null !== $idExternoDestino && '' !== trim($idExternoDestino)) {
            $this->idExternoDestino = trim($idExternoDestino);
        }
        if (null !== $tituloDestino && '' !== trim($tituloDestino)) {
            $this->tituloDestino = trim($tituloDestino);
        }
        if (null !== $artistasDestino && '' !== trim($artistasDestino)) {
            $this->artistasDestino = trim($artistasDestino);
        }

        return $this;
    }
}
