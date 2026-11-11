<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\FonteReproducaoMusical;
use App\Repository\ReproducaoMusicalRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ReproducaoMusicalRepository::class)]
#[ORM\Table(name: 'reproducao_musical')]
#[ORM\UniqueConstraint(name: 'UNIQ_REPRODUCAO_MUSICAL_FONTE_ORIGEM', fields: ['fonte', 'origemId'])]
#[ORM\Index(name: 'IDX_REPRODUCAO_MUSICAL_USUARIO_TOCADA', fields: ['usuario', 'tocadaEm'])]
#[ORM\Index(name: 'IDX_REPRODUCAO_MUSICAL_USUARIO_MUSICA', fields: ['usuario', 'musica'])]
#[ORM\Index(name: 'IDX_REPRODUCAO_MUSICAL_USUARIO_FONTE_TOCADA', fields: ['usuario', 'fonte', 'tocadaEm'])]
#[ORM\Index(name: 'IDX_REPRODUCAO_MUSICAL_MUSICA_ORIGEM', fields: ['musicaOrigem'])]
class ReproducaoMusical
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')]
    private ?string $id = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\ManyToOne(targetEntity: MusicaCatalogo::class)]
    #[ORM\JoinColumn(name: 'musica_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private MusicaCatalogo $musica;

    #[ORM\ManyToOne(targetEntity: MusicaCatalogo::class)]
    #[ORM\JoinColumn(name: 'musica_origem_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private MusicaCatalogo $musicaOrigem;

    #[ORM\Column(type: 'string', length: 20, enumType: FonteReproducaoMusical::class)]
    private FonteReproducaoMusical $fonte;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $tocadaEm;

    #[ORM\Column(type: 'integer')]
    private int $msReproduzidos;

    #[ORM\Column(type: 'boolean')]
    private bool $tempoExato;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $pulada = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $aleatorio = null;

    #[ORM\Column(type: 'string', length: 36)]
    private string $origemId;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    public function __construct(
        Usuario $usuario,
        MusicaCatalogo $musica,
        FonteReproducaoMusical $fonte,
        DateTimeImmutable $tocadaEm,
        int $msReproduzidos,
        bool $tempoExato,
        string $origemId,
    ) {
        $this->usuario = $usuario;
        $this->musica = $musica->musicaEfetiva();
        $this->musicaOrigem = $musica;
        $this->fonte = $fonte;
        $this->tocadaEm = $tocadaEm;
        $this->msReproduzidos = $msReproduzidos;
        $this->tempoExato = $tempoExato;
        $this->origemId = $origemId;
        $this->criadoEm = new DateTimeImmutable();
    }

    public function id(): ?string
    {
        return $this->id;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function musica(): MusicaCatalogo
    {
        return $this->musica;
    }

    public function musicaOrigem(): MusicaCatalogo
    {
        return $this->musicaOrigem;
    }

    public function fonte(): FonteReproducaoMusical
    {
        return $this->fonte;
    }

    public function tocadaEm(): DateTimeImmutable
    {
        return $this->tocadaEm;
    }

    public function msReproduzidos(): int
    {
        return $this->msReproduzidos;
    }

    public function tempoExato(): bool
    {
        return $this->tempoExato;
    }

    public function pulada(): ?bool
    {
        return $this->pulada;
    }

    public function aleatorio(): ?bool
    {
        return $this->aleatorio;
    }

    public function origemId(): string
    {
        return $this->origemId;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }
}
