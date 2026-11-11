<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\TipoMusicaCatalogo;
use App\Repository\MusicaCatalogoRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: MusicaCatalogoRepository::class)]
#[ORM\Table(name: 'musica_catalogo')]
#[ORM\UniqueConstraint(name: 'UNIQ_MUSICA_CATALOGO_USUARIO_CHAVE', fields: ['usuario', 'chaveNormalizada'])]
#[ORM\HasLifecycleCallbacks]
class MusicaCatalogo
{
    private const int TAMANHO_MAXIMO_TITULO = 500;
    private const int PROFUNDIDADE_MAXIMA_UNIAO = 10;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 500)]
    private string $titulo;

    #[ORM\Column(type: 'string', length: 20, enumType: TipoMusicaCatalogo::class)]
    private TipoMusicaCatalogo $tipo;

    #[ORM\Column(type: 'string', length: 512)]
    private string $chaveNormalizada;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $album = null;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $urlCapa = null;

    #[ORM\Column(type: 'string', length: 32, nullable: true)]
    private ?string $videoOficialId = null;

    #[ORM\Column(type: 'boolean')]
    private bool $confirmadaManualmente = false;

    #[ORM\ManyToOne(targetEntity: self::class)]
    #[ORM\JoinColumn(name: 'unida_a_uuid', referencedColumnName: 'uuid', nullable: true, onDelete: 'SET NULL')]
    private ?MusicaCatalogo $unidaA = null;

    /**
     * @var Collection<int, MusicaArtistaCatalogo>
     */
    #[ORM\OneToMany(targetEntity: MusicaArtistaCatalogo::class, mappedBy: 'musica', cascade: ['persist'], orphanRemoval: true)]
    #[ORM\OrderBy(['posicao' => 'ASC'])]
    private Collection $artistas;

    /**
     * @var Collection<int, ComponenteMashup>
     */
    #[ORM\OneToMany(targetEntity: ComponenteMashup::class, mappedBy: 'mashup', cascade: ['persist'], orphanRemoval: true)]
    #[ORM\OrderBy(['posicao' => 'ASC'])]
    private Collection $componentes;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $atualizadoEm;

    public function __construct(Usuario $usuario, string $titulo, TipoMusicaCatalogo $tipo, string $chaveNormalizada)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->titulo = mb_substr($titulo, 0, self::TAMANHO_MAXIMO_TITULO);
        $this->tipo = $tipo;
        $this->chaveNormalizada = $chaveNormalizada;
        $this->artistas = new ArrayCollection();
        $this->componentes = new ArrayCollection();
        $this->criadoEm = new DateTimeImmutable();
        $this->atualizadoEm = new DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function atualizarDataModificacao(): void
    {
        $this->atualizadoEm = new DateTimeImmutable();
    }

    public function adicionarArtista(ArtistaCatalogo $artista): self
    {
        foreach ($this->artistas as $vinculo) {
            if ($vinculo->artista() === $artista) {
                return $this;
            }
        }

        $this->artistas->add(new MusicaArtistaCatalogo($this, $artista, $this->artistas->count()));

        return $this;
    }

    public function adicionarComponente(string $texto, ?self $musicaComponente): self
    {
        $this->componentes->add(new ComponenteMashup($this, $texto, $musicaComponente, $this->componentes->count()));

        return $this;
    }

    public function completarDados(?string $album, ?string $urlCapa, ?string $videoOficialId): self
    {
        $this->album ??= $album;
        $this->urlCapa ??= $urlCapa;
        $this->videoOficialId ??= $videoOficialId;

        return $this;
    }

    public function renomear(string $titulo, string $chaveNormalizada): self
    {
        $this->titulo = mb_substr($titulo, 0, self::TAMANHO_MAXIMO_TITULO);
        $this->chaveNormalizada = $chaveNormalizada;

        return $this;
    }

    public function confirmarManualmente(): self
    {
        $this->confirmadaManualmente = true;

        return $this;
    }

    /**
     * @param list<ArtistaCatalogo> $artistas
     */
    public function definirArtistas(array $artistas): self
    {
        $existentes = [];
        foreach ($this->artistas as $vinculo) {
            $existentes[$vinculo->artista()->uuid()->toRfc4122()] = $vinculo;
        }

        $mantidos = [];
        foreach (array_values($artistas) as $posicao => $artista) {
            $chave = $artista->uuid()->toRfc4122();
            if (isset($mantidos[$chave])) {
                continue;
            }
            $vinculo = $existentes[$chave] ?? new MusicaArtistaCatalogo($this, $artista, $posicao);
            $vinculo->reposicionar($posicao);
            if (!isset($existentes[$chave])) {
                $this->artistas->add($vinculo);
            }
            $mantidos[$chave] = true;
        }

        foreach ($existentes as $chave => $vinculo) {
            if (!isset($mantidos[$chave])) {
                $this->artistas->removeElement($vinculo);
            }
        }

        return $this;
    }

    /**
     * @param list<array{texto: string, musica: ?MusicaCatalogo}> $componentes
     */
    public function definirComponentes(array $componentes, string $chaveNormalizada, string $titulo): self
    {
        $this->componentes->clear();
        foreach ($componentes as $componente) {
            $this->adicionarComponente($componente['texto'], $componente['musica']);
        }
        $this->chaveNormalizada = $chaveNormalizada;
        $this->titulo = mb_substr($titulo, 0, self::TAMANHO_MAXIMO_TITULO);

        return $this;
    }

    public function unirA(self $destino): self
    {
        $this->unidaA = $destino;

        return $this;
    }

    public function desfazerUniao(): self
    {
        $this->unidaA = null;

        return $this;
    }

    public function musicaEfetiva(): self
    {
        $atual = $this;
        for ($passo = 0; null !== $atual->unidaA && $passo < self::PROFUNDIDADE_MAXIMA_UNIAO; ++$passo) {
            $atual = $atual->unidaA;
        }

        return $atual;
    }

    public function unidaA(): ?self
    {
        return $this->unidaA;
    }

    public function isMashup(): bool
    {
        return $this->tipo->isMashup();
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function titulo(): string
    {
        return $this->titulo;
    }

    public function tipo(): TipoMusicaCatalogo
    {
        return $this->tipo;
    }

    public function chaveNormalizada(): string
    {
        return $this->chaveNormalizada;
    }

    public function album(): ?string
    {
        return $this->album;
    }

    public function urlCapa(): ?string
    {
        return $this->urlCapa;
    }

    public function videoOficialId(): ?string
    {
        return $this->videoOficialId;
    }

    public function confirmadaManualmente(): bool
    {
        return $this->confirmadaManualmente;
    }

    /**
     * @return list<ArtistaCatalogo>
     */
    public function artistas(): array
    {
        $vinculos = $this->artistas->toArray();
        usort($vinculos, static fn (MusicaArtistaCatalogo $a, MusicaArtistaCatalogo $b): int => $a->posicao() <=> $b->posicao());

        return array_values(array_map(static fn (MusicaArtistaCatalogo $vinculo): ArtistaCatalogo => $vinculo->artista(), $vinculos));
    }

    /**
     * @return list<ComponenteMashup>
     */
    public function componentes(): array
    {
        return array_values($this->componentes->toArray());
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function atualizadoEm(): DateTimeImmutable
    {
        return $this->atualizadoEm;
    }
}
