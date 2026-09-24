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
#[ORM\UniqueConstraint(name: 'UNIQ_CATEGORIA_NOME', fields: ['nome'])]
class Categoria
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private ?Uuid $uuid = null;

    #[ORM\Column(type: 'string', length: 100, unique: true)]
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
        string $nome,
        string $pastaLocal,
        ?string $googlePhotosAlbumId = null,
    ) {
        $this->uuid = Uuid::v7();
        $this->nome = $nome;
        $this->pastaLocal = $pastaLocal;
        $this->googlePhotosAlbumId = $googlePhotosAlbumId;
        $this->criadoEm = new \DateTimeImmutable();
        $this->atualizadoEm = new \DateTimeImmutable();
    }

    public static function fromDTO(CriarCategoriaDTO $dto): self
    {
        return new self(
            nome: $dto->nome(),
            pastaLocal: $dto->pastaLocal(),
            googlePhotosAlbumId: $dto->googlePhotosAlbumId(),
        );
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

    public function setPastaLocal(string $pastaLocal): self
    {
        $this->pastaLocal = $pastaLocal;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function googlePhotosAlbumId(): ?string
    {
        return $this->googlePhotosAlbumId;
    }

    public function setGooglePhotosAlbumId(?string $googlePhotosAlbumId): self
    {
        $this->googlePhotosAlbumId = $googlePhotosAlbumId;
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
