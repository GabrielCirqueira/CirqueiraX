<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\StatusContaSpotify;
use App\Repository\ContaSpotifyRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ContaSpotifyRepository::class)]
#[ORM\Table(name: 'conta_spotify')]
#[ORM\UniqueConstraint(name: 'UNIQ_CONTA_SPOTIFY_USUARIO', fields: ['usuario'])]
#[ORM\Index(name: 'IDX_CONTA_SPOTIFY_SPOTIFY_ID', fields: ['spotifyId'])]
#[ORM\Index(name: 'IDX_CONTA_SPOTIFY_STATUS', fields: ['status'])]
class ContaSpotify
{
    public const int MARGEM_EXPIRACAO_SEGUNDOS = 300;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\OneToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 255)]
    private string $spotifyId;

    #[ORM\Column(type: 'string', length: 255)]
    private string $nomeExibicao;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $urlFoto = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $accessTokenCriptografado = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $refreshTokenCriptografado = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $expiraEm = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $escopos = null;

    #[ORM\Column(type: 'string', length: 30, enumType: StatusContaSpotify::class)]
    private StatusContaSpotify $status;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $conectadoEm = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $ultimaColetaEm = null;

    #[ORM\Column(type: 'bigint', nullable: true)]
    private ?int $cursorUltimaReproducaoMs = null;

    #[ORM\Column(type: 'string', length: 500, nullable: true)]
    private ?string $erroMotivo = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $atualizadoEm;

    public function __construct(Usuario $usuario)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->spotifyId = '';
        $this->nomeExibicao = '';
        $this->status = StatusContaSpotify::Desconectada;
        $this->criadoEm = new \DateTimeImmutable();
        $this->atualizadoEm = new \DateTimeImmutable();
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function spotifyId(): string
    {
        return $this->spotifyId;
    }

    public function nomeExibicao(): string
    {
        return $this->nomeExibicao;
    }

    public function urlFoto(): ?string
    {
        return $this->urlFoto;
    }

    public function accessTokenCriptografado(): ?string
    {
        return $this->accessTokenCriptografado;
    }

    public function refreshTokenCriptografado(): ?string
    {
        return $this->refreshTokenCriptografado;
    }

    public function expiraEm(): ?\DateTimeImmutable
    {
        return $this->expiraEm;
    }

    public function escopos(): ?string
    {
        return $this->escopos;
    }

    public function status(): StatusContaSpotify
    {
        return $this->status;
    }

    public function conectadoEm(): ?\DateTimeImmutable
    {
        return $this->conectadoEm;
    }

    public function ultimaColetaEm(): ?\DateTimeImmutable
    {
        return $this->ultimaColetaEm;
    }

    public function cursorUltimaReproducaoMs(): ?int
    {
        return $this->cursorUltimaReproducaoMs;
    }

    public function erroMotivo(): ?string
    {
        return $this->erroMotivo;
    }

    public function criadoEm(): \DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function atualizadoEm(): \DateTimeImmutable
    {
        return $this->atualizadoEm;
    }

    public function conectar(
        string $spotifyId,
        string $nomeExibicao,
        ?string $urlFoto,
        string $accessTokenCriptografado,
        string $refreshTokenCriptografado,
        int $expiraEmSegundos,
        string $escopos,
    ): self {
        $agora = new \DateTimeImmutable();

        $this->spotifyId = $spotifyId;
        $this->nomeExibicao = $nomeExibicao;
        $this->urlFoto = $urlFoto;
        $this->accessTokenCriptografado = $accessTokenCriptografado;
        $this->refreshTokenCriptografado = $refreshTokenCriptografado;
        $this->expiraEm = $agora->modify(sprintf('+%d seconds', $expiraEmSegundos));
        $this->escopos = $escopos;
        $this->status = StatusContaSpotify::Conectada;
        $this->conectadoEm = $agora;
        $this->erroMotivo = null;
        $this->atualizadoEm = $agora;

        return $this;
    }

    public function renovarTokens(
        string $accessTokenCriptografado,
        ?string $refreshTokenCriptografado,
        int $expiraEmSegundos,
    ): self {
        $agora = new \DateTimeImmutable();

        $this->accessTokenCriptografado = $accessTokenCriptografado;
        if (null !== $refreshTokenCriptografado && '' !== trim($refreshTokenCriptografado)) {
            $this->refreshTokenCriptografado = $refreshTokenCriptografado;
        }

        $this->expiraEm = $agora->modify(sprintf('+%d seconds', $expiraEmSegundos));
        $this->status = StatusContaSpotify::Conectada;
        $this->erroMotivo = null;
        $this->atualizadoEm = $agora;

        return $this;
    }

    public function marcarComoReconectar(string $motivo): self
    {
        $this->status = StatusContaSpotify::Reconectar;
        $this->erroMotivo = mb_substr($motivo, 0, 500);
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function desconectar(): self
    {
        $this->accessTokenCriptografado = null;
        $this->refreshTokenCriptografado = null;
        $this->expiraEm = null;
        $this->status = StatusContaSpotify::Desconectada;
        $this->erroMotivo = null;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function registrarColeta(?int $novoCursorMs = null): self
    {
        $this->ultimaColetaEm = new \DateTimeImmutable();
        if (null !== $novoCursorMs && $novoCursorMs > 0) {
            $this->cursorUltimaReproducaoMs = $novoCursorMs;
        }
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function isTokenExpirado(): bool
    {
        if (null === $this->accessTokenCriptografado || null === $this->expiraEm) {
            return true;
        }

        $limiteSeguro = (new \DateTimeImmutable())->modify(sprintf('+%d seconds', self::MARGEM_EXPIRACAO_SEGUNDOS));

        return $this->expiraEm <= $limiteSeguro;
    }

    public function isConectada(): bool
    {
        return $this->status->isConectada();
    }

    public function isReconectar(): bool
    {
        return $this->status->isReconectar();
    }

    public function isDesconectada(): bool
    {
        return $this->status->isDesconectada();
    }
}
