<?php

declare(strict_types=1);

namespace App\Entity;

use App\DataObject\CriarCategoriaDTO;
use App\Repository\CategoriaRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: CategoriaRepository::class)]
#[ORM\Table(name: 'categoria')]
#[ORM\UniqueConstraint(name: 'UNIQ_CATEGORIA_USUARIO_NOME', fields: ['usuario', 'nome'])]
class Categoria
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private ?Uuid $uuid = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 100)]
    private string $nome;

    #[ORM\Column(type: 'string', length: 255)]
    private string $pastaLocal;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $googlePhotosAlbumId = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $atualizadoEm;

    public function __construct(
        Usuario $usuario,
        string $nome,
        string $pastaLocal,
        ?string $googlePhotosAlbumId = null,
    ) {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->nome = $nome;
        $this->pastaLocal = $pastaLocal;
        $this->googlePhotosAlbumId = $googlePhotosAlbumId;
        $this->criadoEm = new \DateTimeImmutable();
        $this->atualizadoEm = new \DateTimeImmutable();
    }

    public static function fromDTO(CriarCategoriaDTO $dto, Usuario $usuario): self
    {
        return new self(
            usuario: $usuario,
            nome: $dto->nome(),
            pastaLocal: $dto->pastaLocal(),
            googlePhotosAlbumId: $dto->googlePhotosAlbumId(),
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

    public function nome(): string
    {
        return $this->nome;
    }

    public function setNome(string $nome): self
    {
        $this->nome = $nome;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function pastaLocal(): string
    {
        return $this->pastaLocal;
    }

    public function diretorioRelativo(): string
    {
        $partes = array_filter(
            explode('/', $this->usuario->pastaArmazenamento() . '/' . $this->pastaLocal),
            static fn (string $parte): bool => '' !== $parte && '.' !== $parte && '..' !== $parte,
        );

        return implode('/', $partes);
    }

    public function setPastaLocal(string $pastaLocal): self
    {
        $this->pastaLocal = $pastaLocal;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function googleFotosAlbumId(): ?string
    {
        return $this->googlePhotosAlbumId;
    }

    public function setGoogleFotosAlbumId(?string $googleFotosAlbumId): self
    {
        $this->googlePhotosAlbumId = $googleFotosAlbumId;
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
