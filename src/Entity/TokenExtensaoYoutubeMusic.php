<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\TokenExtensaoYoutubeMusicRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: TokenExtensaoYoutubeMusicRepository::class)]
#[ORM\Table(name: 'token_extensao_youtube_music')]
#[ORM\UniqueConstraint(name: 'UNIQ_TOKEN_EXTENSAO_YOUTUBE_HASH', fields: ['tokenHash'])]
#[ORM\Index(name: 'IDX_TOKEN_EXTENSAO_YOUTUBE_USUARIO', fields: ['usuario'])]
class TokenExtensaoYoutubeMusic
{
    public const int TAMANHO_MAXIMO_NOME = 60;
    private const int INTERVALO_REGISTRO_USO_SEGUNDOS = 60;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: self::TAMANHO_MAXIMO_NOME)]
    private string $nomeAparelho;

    #[ORM\Column(type: 'string', length: 64)]
    private string $tokenHash;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $ultimoUsoEm = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $revogadoEm = null;

    public function __construct(Usuario $usuario, string $nomeAparelho, string $tokenHash)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->nomeAparelho = mb_substr(trim($nomeAparelho), 0, self::TAMANHO_MAXIMO_NOME);
        $this->tokenHash = $tokenHash;
        $this->criadoEm = new DateTimeImmutable();
    }

    public function revogar(): self
    {
        $this->revogadoEm = new DateTimeImmutable();

        return $this;
    }

    public function registrarUso(DateTimeImmutable $momento): self
    {
        $this->ultimoUsoEm = $momento;

        return $this;
    }

    public function isUsoParaRegistrar(DateTimeImmutable $momento): bool
    {
        return null === $this->ultimoUsoEm || $momento->getTimestamp() - $this->ultimoUsoEm->getTimestamp() >= self::INTERVALO_REGISTRO_USO_SEGUNDOS;
    }

    public function isAtivo(): bool
    {
        return null === $this->revogadoEm;
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function nomeAparelho(): string
    {
        return $this->nomeAparelho;
    }

    public function tokenHash(): string
    {
        return $this->tokenHash;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function ultimoUsoEm(): ?DateTimeImmutable
    {
        return $this->ultimoUsoEm;
    }

    public function revogadoEm(): ?DateTimeImmutable
    {
        return $this->revogadoEm;
    }
}
