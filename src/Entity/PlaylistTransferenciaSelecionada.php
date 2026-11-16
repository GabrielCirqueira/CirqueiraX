<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\DecisaoPlaylistDestino;
use App\Repository\PlaylistTransferenciaSelecionadaRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PlaylistTransferenciaSelecionadaRepository::class)]
#[ORM\Table(name: 'playlist_transferencia_selecionada')]
#[ORM\Index(name: 'IDX_PLAYLIST_TRANSF_SELEC_TRANSFERENCIA', fields: ['transferencia'])]
class PlaylistTransferenciaSelecionada
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: TransferenciaPlaylist::class, inversedBy: 'playlistsSelecionadas')]
    #[ORM\JoinColumn(name: 'transferencia_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private TransferenciaPlaylist $transferencia;

    #[ORM\Column(type: 'string', length: 128)]
    private string $idExternoOrigem;

    #[ORM\Column(type: 'string', length: 512)]
    private string $nomeOrigem;

    #[ORM\Column(type: 'integer')]
    private int $totalFaixasOrigem = 0;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $urlCapaOrigem = null;

    #[ORM\Column(type: 'string', length: 128, nullable: true)]
    private ?string $snapshotIdOrigem = null;

    #[ORM\Column(type: 'string', length: 128, nullable: true)]
    private ?string $idExternoDestinoExistente = null;

    #[ORM\Column(type: 'string', length: 512, nullable: true)]
    private ?string $nomeDestinoExistente = null;

    #[ORM\Column(type: 'string', length: 40, enumType: DecisaoPlaylistDestino::class)]
    private DecisaoPlaylistDestino $decisao;

    #[ORM\Column(type: 'string', length: 128, nullable: true)]
    private ?string $idExternoDestinoFinal = null;

    #[ORM\Column(type: 'integer')]
    private int $progressoFaixas = 0;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    public function __construct(
        TransferenciaPlaylist $transferencia,
        string $idExternoOrigem,
        string $nomeOrigem,
        int $totalFaixasOrigem = 0,
        ?string $urlCapaOrigem = null,
        ?string $snapshotIdOrigem = null,
        ?string $idExternoDestinoExistente = null,
        ?string $nomeDestinoExistente = null,
        DecisaoPlaylistDestino $decisao = DecisaoPlaylistDestino::CriarNova,
    ) {
        $this->uuid = Uuid::v7();
        $this->transferencia = $transferencia;
        $this->idExternoOrigem = $idExternoOrigem;
        $this->nomeOrigem = $nomeOrigem;
        $this->totalFaixasOrigem = $totalFaixasOrigem;
        $this->urlCapaOrigem = $urlCapaOrigem;
        $this->snapshotIdOrigem = $snapshotIdOrigem;
        $this->idExternoDestinoExistente = $idExternoDestinoExistente;
        $this->nomeDestinoExistente = $nomeDestinoExistente;
        $this->decisao = $decisao;
        $this->criadoEm = new DateTimeImmutable();
        $transferencia->adicionarPlaylistSelecionada($this);
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function transferencia(): TransferenciaPlaylist
    {
        return $this->transferencia;
    }

    public function idExternoOrigem(): string
    {
        return $this->idExternoOrigem;
    }

    public function nomeOrigem(): string
    {
        return $this->nomeOrigem;
    }

    public function totalFaixasOrigem(): int
    {
        return $this->totalFaixasOrigem;
    }

    public function urlCapaOrigem(): ?string
    {
        return $this->urlCapaOrigem;
    }

    public function snapshotIdOrigem(): ?string
    {
        return $this->snapshotIdOrigem;
    }

    public function idExternoDestinoExistente(): ?string
    {
        return $this->idExternoDestinoExistente;
    }

    public function nomeDestinoExistente(): ?string
    {
        return $this->nomeDestinoExistente;
    }

    public function decisao(): DecisaoPlaylistDestino
    {
        return $this->decisao;
    }

    public function setDecisao(DecisaoPlaylistDestino $decisao): self
    {
        $this->decisao = $decisao;

        return $this;
    }

    public function idExternoDestinoFinal(): ?string
    {
        return $this->idExternoDestinoFinal;
    }

    public function definirDestinoFinal(string $idExternoDestinoFinal): self
    {
        $this->idExternoDestinoFinal = $idExternoDestinoFinal;

        return $this;
    }

    public function progressoFaixas(): int
    {
        return $this->progressoFaixas;
    }

    public function avancarProgressoFaixas(int $quantidade = 1): self
    {
        $this->progressoFaixas += $quantidade;

        return $this;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }
}
