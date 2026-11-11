<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\StatusContaYoutubeMusic;
use App\Repository\ContaYoutubeMusicRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ContaYoutubeMusicRepository::class)]
#[ORM\Table(name: 'conta_youtube_music')]
#[ORM\UniqueConstraint(name: 'UNIQ_CONTA_YOUTUBE_MUSIC_USUARIO', fields: ['usuario'])]
#[ORM\Index(name: 'IDX_CONTA_YOUTUBE_MUSIC_STATUS_PROXIMA', fields: ['status', 'proximaConsultaEm'])]
#[ORM\HasLifecycleCallbacks]
class ContaYoutubeMusic
{
    public const int TAMANHO_SNAPSHOT_TOPO = 50;
    private const int TAMANHO_MAXIMO_MOTIVO = 500;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\OneToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $credenciaisCriptografadas = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $nomeConta = null;

    #[ORM\Column(type: 'string', length: 30, enumType: StatusContaYoutubeMusic::class)]
    private StatusContaYoutubeMusic $status;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $conectadoEm = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $ultimaConsultaEm = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $ultimaNovidadeEm = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $proximaConsultaEm = null;

    #[ORM\Column(type: 'integer')]
    private int $errosSeguidos = 0;

    #[ORM\Column(type: 'string', length: 500, nullable: true)]
    private ?string $erroMotivo = null;

    /**
     * @var list<string>|null
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $snapshotTopo = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $atualizadoEm;

    public function __construct(Usuario $usuario)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->status = StatusContaYoutubeMusic::Desconectada;
        $this->criadoEm = new DateTimeImmutable();
        $this->atualizadoEm = new DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function atualizarDataModificacao(): void
    {
        $this->atualizadoEm = new DateTimeImmutable();
    }

    public function conectar(string $credenciaisCriptografadas, ?string $nomeConta, DateTimeImmutable $proximaConsultaEm): self
    {
        $this->credenciaisCriptografadas = $credenciaisCriptografadas;
        $this->nomeConta = $nomeConta;
        $this->status = StatusContaYoutubeMusic::Conectada;
        $this->conectadoEm = new DateTimeImmutable();
        $this->proximaConsultaEm = $proximaConsultaEm;
        $this->errosSeguidos = 0;
        $this->erroMotivo = null;
        $this->snapshotTopo = null;

        return $this;
    }

    /**
     * @param list<string> $snapshotTopo
     */
    public function registrarConsulta(array $snapshotTopo, bool $houveNovidade): self
    {
        $agora = new DateTimeImmutable();
        $this->ultimaConsultaEm = $agora;
        $this->snapshotTopo = $snapshotTopo;
        $this->errosSeguidos = 0;
        $this->erroMotivo = null;

        if ($houveNovidade) {
            $this->ultimaNovidadeEm = $agora;
        }

        return $this;
    }

    public function registrarErro(string $motivo): self
    {
        $this->ultimaConsultaEm = new DateTimeImmutable();
        ++$this->errosSeguidos;
        $this->erroMotivo = mb_substr($motivo, 0, self::TAMANHO_MAXIMO_MOTIVO);

        return $this;
    }

    public function marcarComoReconectar(string $motivo): self
    {
        $this->status = StatusContaYoutubeMusic::Reconectar;
        $this->erroMotivo = mb_substr($motivo, 0, self::TAMANHO_MAXIMO_MOTIVO);
        $this->proximaConsultaEm = null;

        return $this;
    }

    public function desconectar(): self
    {
        $this->credenciaisCriptografadas = null;
        $this->snapshotTopo = null;
        $this->status = StatusContaYoutubeMusic::Desconectada;
        $this->proximaConsultaEm = null;
        $this->errosSeguidos = 0;
        $this->erroMotivo = null;

        return $this;
    }

    public function definirProximaConsulta(DateTimeImmutable $proximaConsultaEm): self
    {
        $this->proximaConsultaEm = $proximaConsultaEm;

        return $this;
    }

    public function isConectada(): bool
    {
        return $this->status->isConectada() && null !== $this->credenciaisCriptografadas;
    }

    public function isReconectar(): bool
    {
        return $this->status->isReconectar();
    }

    public function isDesconectada(): bool
    {
        return $this->status->isDesconectada();
    }

    public function isPrimeiraConsulta(): bool
    {
        return null === $this->snapshotTopo;
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function credenciaisCriptografadas(): ?string
    {
        return $this->credenciaisCriptografadas;
    }

    public function nomeConta(): ?string
    {
        return $this->nomeConta;
    }

    public function status(): StatusContaYoutubeMusic
    {
        return $this->status;
    }

    public function conectadoEm(): ?DateTimeImmutable
    {
        return $this->conectadoEm;
    }

    public function ultimaConsultaEm(): ?DateTimeImmutable
    {
        return $this->ultimaConsultaEm;
    }

    public function ultimaNovidadeEm(): ?DateTimeImmutable
    {
        return $this->ultimaNovidadeEm;
    }

    public function proximaConsultaEm(): ?DateTimeImmutable
    {
        return $this->proximaConsultaEm;
    }

    public function errosSeguidos(): int
    {
        return $this->errosSeguidos;
    }

    public function erroMotivo(): ?string
    {
        return $this->erroMotivo;
    }

    /**
     * @return list<string>
     */
    public function snapshotTopo(): array
    {
        return $this->snapshotTopo ?? [];
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
