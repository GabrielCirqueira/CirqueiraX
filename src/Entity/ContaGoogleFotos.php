<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\ContaGoogleFotosRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ContaGoogleFotosRepository::class)]
#[ORM\Table(name: 'conta_google_fotos')]
#[ORM\UniqueConstraint(name: 'UNIQ_CONTA_GOOGLE_FOTOS_USUARIO', fields: ['usuario'])]
class ContaGoogleFotos
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private ?Uuid $uuid = null;

    #[ORM\OneToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 255)]
    private string $email;

    #[ORM\Column(type: 'text')]
    private string $refreshTokenCriptografado;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $accessTokenCache = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $expiraEm = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $atualizadoEm;

    public function __construct(
        Usuario $usuario,
        string $email,
        string $refreshTokenCriptografado,
    ) {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->email = $email;
        $this->refreshTokenCriptografado = $refreshTokenCriptografado;
        $this->accessTokenCache = null;
        $this->expiraEm = null;
        $this->criadoEm = new \DateTimeImmutable();
        $this->atualizadoEm = new \DateTimeImmutable();
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function uuid(): ?Uuid
    {
        return $this->uuid;
    }

    public function email(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): self
    {
        $this->email = $email;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function refreshTokenCriptografado(): string
    {
        return $this->refreshTokenCriptografado;
    }

    public function setRefreshTokenCriptografado(string $refreshTokenCriptografado): self
    {
        $this->refreshTokenCriptografado = $refreshTokenCriptografado;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function accessTokenCache(): ?string
    {
        return $this->accessTokenCache;
    }

    public function expiraEm(): ?\DateTimeImmutable
    {
        return $this->expiraEm;
    }

    public function setAccessTokenCache(?string $accessTokenCache, ?\DateTimeImmutable $expiraEm = null): self
    {
        $this->accessTokenCache = $accessTokenCache;
        $this->expiraEm = $expiraEm;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function setExpiraEm(?\DateTimeImmutable $expiraEm): self
    {
        $this->expiraEm = $expiraEm;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function accessTokenEstaValido(): bool
    {
        if (null === $this->accessTokenCache || null === $this->expiraEm) {
            return false;
        }

        return $this->expiraEm > new \DateTimeImmutable();
    }

    public function criadoEm(): \DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function atualizadoEm(): \DateTimeImmutable
    {
        return $this->atualizadoEm;
    }
}
