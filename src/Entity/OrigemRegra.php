<?php

declare(strict_types=1);

namespace App\Entity;

use App\DataObject\CriarOrigemRegraDTO;
use App\Enum\OrigemMedia;
use App\Repository\OrigemRegraRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: OrigemRegraRepository::class)]
#[ORM\Table(name: 'origem_regra')]
#[ORM\UniqueConstraint(name: 'UNIQ_ORIGEM_REGRA_USUARIO_ORIGEM', fields: ['usuario', 'origem'])]
class OrigemRegra
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private ?Uuid $uuid = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', enumType: OrigemMedia::class)]
    private OrigemMedia $origem;

    #[ORM\Column(type: 'string', length: 36)]
    private string $categoriaId;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $atualizadoEm;

    public function __construct(
        Usuario $usuario,
        OrigemMedia|string $origem,
        string $categoriaId,
    ) {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->origem = is_string($origem) ? (OrigemMedia::tryFrom($origem) ?? OrigemMedia::MANUAL) : $origem;
        $this->categoriaId = $categoriaId;
        $this->criadoEm = new \DateTimeImmutable();
        $this->atualizadoEm = new \DateTimeImmutable();
    }

    public static function fromDTO(CriarOrigemRegraDTO $dto, Usuario $usuario): self
    {
        return new self(
            usuario: $usuario,
            origem: $dto->origem(),
            categoriaId: $dto->categoriaId(),
        );
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function uuid(): ?Uuid
    {
        return $this->uuid;
    }

    public function origem(): OrigemMedia
    {
        return $this->origem;
    }

    public function setOrigem(OrigemMedia|string $origem): self
    {
        $this->origem = is_string($origem) ? (OrigemMedia::tryFrom($origem) ?? OrigemMedia::MANUAL) : $origem;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function categoriaId(): string
    {
        return $this->categoriaId;
    }

    public function setCategoriaId(string $categoriaId): self
    {
        $this->categoriaId = $categoriaId;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
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
