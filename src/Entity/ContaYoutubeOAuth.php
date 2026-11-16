<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\ContaYoutubeOAuthRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ContaYoutubeOAuthRepository::class)]
#[ORM\Table(name: 'conta_youtube_oauth')]
#[ORM\UniqueConstraint(name: 'UNIQ_CONTA_YOUTUBE_OAUTH_USUARIO', fields: ['usuario'])]
class ContaYoutubeOAuth
{
    public const int MARGEM_EXPIRACAO_SEGUNDOS = 300;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\OneToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 255)]
    private string $email;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $nomeCanal = null;

    #[ORM\Column(type: 'string', length: 64, nullable: true)]
    private ?string $canalId = null;

    #[ORM\Column(type: 'text')]
    private string $refreshTokenCriptografado;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $accessTokenCache = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $expiraEm = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $atualizadoEm;

    public function __construct(
        Usuario $usuario,
        string $email,
        string $refreshTokenCriptografado,
    ) {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->email = $email;
        $this->refreshTokenCriptografado = $refreshTokenCriptografado;
        $this->criadoEm = new DateTimeImmutable();
        $this->atualizadoEm = new DateTimeImmutable();
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function email(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): self
    {
        $this->email = $email;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function nomeCanal(): ?string
    {
        return $this->nomeCanal;
    }

    public function setNomeCanal(?string $nomeCanal): self
    {
        $this->nomeCanal = $nomeCanal;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function canalId(): ?string
    {
        return $this->canalId;
    }

    public function setCanalId(?string $canalId): self
    {
        $this->canalId = $canalId;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function refreshTokenCriptografado(): string
    {
        return $this->refreshTokenCriptografado;
    }

    public function setRefreshTokenCriptografado(string $refreshTokenCriptografado): self
    {
        $this->refreshTokenCriptografado = $refreshTokenCriptografado;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function accessTokenCache(): ?string
    {
        return $this->accessTokenCache;
    }

    public function expiraEm(): ?DateTimeImmutable
    {
        return $this->expiraEm;
    }

    public function setAccessTokenCache(?string $accessTokenCache, ?DateTimeImmutable $expiraEm = null): self
    {
        $this->accessTokenCache = $accessTokenCache;
        $this->expiraEm = $expiraEm;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function accessTokenEstaValido(): bool
    {
        if (null === $this->accessTokenCache || null === $this->expiraEm) {
            return false;
        }

        $limite = $this->expiraEm->modify(sprintf('-%d seconds', self::MARGEM_EXPIRACAO_SEGUNDOS));

        return $limite > new DateTimeImmutable();
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
