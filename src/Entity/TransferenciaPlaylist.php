<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\ServicoPlaylist;
use App\Enum\StatusTransferenciaPlaylist;
use App\Repository\TransferenciaPlaylistRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: TransferenciaPlaylistRepository::class)]
#[ORM\Table(name: 'transferencia_playlist')]
#[ORM\Index(name: 'IDX_TRANSFERENCIA_PLAYLIST_USUARIO', fields: ['usuario'])]
#[ORM\Index(name: 'IDX_TRANSFERENCIA_PLAYLIST_STATUS', fields: ['status'])]
class TransferenciaPlaylist
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 20, enumType: ServicoPlaylist::class)]
    private ServicoPlaylist $origem;

    #[ORM\Column(type: 'string', length: 20, enumType: ServicoPlaylist::class)]
    private ServicoPlaylist $destino;

    #[ORM\Column(type: 'string', length: 30, enumType: StatusTransferenciaPlaylist::class)]
    private StatusTransferenciaPlaylist $status;

    #[ORM\Column(type: 'integer')]
    private int $totalFaixas = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalCasadas = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalDuvidosas = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalNaoEncontradas = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalTransferidas = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalFalhas = 0;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $mensagemErro = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $atualizadoEm;

    /** @var Collection<int, PlaylistTransferenciaSelecionada> */
    #[ORM\OneToMany(targetEntity: PlaylistTransferenciaSelecionada::class, mappedBy: 'transferencia', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $playlistsSelecionadas;

    /** @var Collection<int, ItemTransferenciaPlaylist> */
    #[ORM\OneToMany(targetEntity: ItemTransferenciaPlaylist::class, mappedBy: 'transferencia', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['ordem' => 'ASC'])]
    private Collection $itens;

    public function __construct(Usuario $usuario, ServicoPlaylist $origem, ServicoPlaylist $destino)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->origem = $origem;
        $this->destino = $destino;
        $this->status = StatusTransferenciaPlaylist::Rascunho;
        $this->criadoEm = new DateTimeImmutable();
        $this->atualizadoEm = new DateTimeImmutable();
        $this->playlistsSelecionadas = new ArrayCollection();
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

    public function origem(): ServicoPlaylist
    {
        return $this->origem;
    }

    public function destino(): ServicoPlaylist
    {
        return $this->destino;
    }

    public function status(): StatusTransferenciaPlaylist
    {
        return $this->status;
    }

    public function totalFaixas(): int
    {
        return $this->totalFaixas;
    }

    public function totalCasadas(): int
    {
        return $this->totalCasadas;
    }

    public function totalDuvidosas(): int
    {
        return $this->totalDuvidosas;
    }

    public function totalNaoEncontradas(): int
    {
        return $this->totalNaoEncontradas;
    }

    public function totalTransferidas(): int
    {
        return $this->totalTransferidas;
    }

    public function totalFalhas(): int
    {
        return $this->totalFalhas;
    }

    public function mensagemErro(): ?string
    {
        return $this->mensagemErro;
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
     * @return Collection<int, PlaylistTransferenciaSelecionada>
     */
    public function playlistsSelecionadas(): Collection
    {
        return $this->playlistsSelecionadas;
    }

    /**
     * @return Collection<int, ItemTransferenciaPlaylist>
     */
    public function itens(): Collection
    {
        return $this->itens;
    }

    public function adicionarPlaylistSelecionada(PlaylistTransferenciaSelecionada $playlist): self
    {
        if (!$this->playlistsSelecionadas->contains($playlist)) {
            $this->playlistsSelecionadas->add($playlist);
        }

        return $this;
    }

    public function adicionarItem(ItemTransferenciaPlaylist $item): self
    {
        if (!$this->itens->contains($item)) {
            $this->itens->add($item);
        }

        return $this;
    }

    public function isEditavel(): bool
    {
        return $this->status->isEditavel();
    }

    public function isEmAndamento(): bool
    {
        return $this->status->isEmAndamento();
    }

    public function isFinalizada(): bool
    {
        return $this->status->isFinalizada();
    }

    public function isPrevia(): bool
    {
        return $this->status->isPrevia();
    }

    public function isCasando(): bool
    {
        return $this->status->isCasando();
    }

    public function isPausadaCota(): bool
    {
        return $this->status->isPausadaCota();
    }

    public function iniciarCasamento(): self
    {
        $this->status = StatusTransferenciaPlaylist::Casando;
        $this->mensagemErro = null;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function marcarPrevia(): self
    {
        $this->status = StatusTransferenciaPlaylist::Previa;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function iniciarExecucao(): self
    {
        $this->status = StatusTransferenciaPlaylist::Executando;
        $this->mensagemErro = null;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function pausarPorCota(string $mensagem): self
    {
        $this->status = StatusTransferenciaPlaylist::PausadaCota;
        $this->mensagemErro = $mensagem;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function concluir(): self
    {
        $this->status = StatusTransferenciaPlaylist::Concluida;
        $this->mensagemErro = null;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function falhar(string $mensagem): self
    {
        $this->status = StatusTransferenciaPlaylist::Falha;
        $this->mensagemErro = $mensagem;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function atualizarContadores(
        int $totalFaixas,
        int $totalCasadas,
        int $totalDuvidosas,
        int $totalNaoEncontradas,
        int $totalTransferidas,
        int $totalFalhas,
    ): self {
        $this->totalFaixas = $totalFaixas;
        $this->totalCasadas = $totalCasadas;
        $this->totalDuvidosas = $totalDuvidosas;
        $this->totalNaoEncontradas = $totalNaoEncontradas;
        $this->totalTransferidas = $totalTransferidas;
        $this->totalFalhas = $totalFalhas;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function incrementarTotalFaixas(int $quantidade = 1): self
    {
        $this->totalFaixas += $quantidade;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }
}
