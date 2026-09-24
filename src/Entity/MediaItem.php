<?php

declare(strict_types=1);

namespace App\Entity;

use App\DataObject\CriarMediaItemDTO;
use App\Enum\OrigemMedia;
use App\Enum\StatusMediaItem;
use App\Repository\MediaItemRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: MediaItemRepository::class)]
#[ORM\Table(name: 'media_item')]
#[ORM\UniqueConstraint(name: 'UNIQ_MEDIA_ITEM_HASH', fields: ['hash'])]
class MediaItem
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private ?Uuid $uuid = null;

    #[ORM\Column(type: 'string', length: 64, unique: true)]
    private string $hash;

    #[ORM\Column(type: 'string', enumType: OrigemMedia::class)]
    private OrigemMedia $origem;

    #[ORM\Column(type: 'string', enumType: StatusMediaItem::class)]
    private StatusMediaItem $status;

    #[ORM\Column(type: 'string', length: 512, nullable: true)]
    private ?string $caminhoLocal = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $googlePhotosMediaId = null;

    #[ORM\Column(type: 'string', length: 36, nullable: true)]
    private ?string $categoriaId = null;

    /**
     * @var array<string, mixed>
     */
    #[ORM\Column(type: 'json')]
    private array $metadata = [];

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $erroMotivo = null;

    /**
     * @var array<int, array{de?: string, para: string, em: string}>
     */
    #[ORM\Column(type: 'json')]
    private array $historicoStatus = [];

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $atualizadoEm;

    public function __construct(
        string $hash,
        OrigemMedia|string $origem,
        StatusMediaItem|string $status = StatusMediaItem::RECEBIDO,
    ) {
        $this->uuid = Uuid::v7();
        $this->hash = $hash;
        $this->origem = is_string($origem) ? (OrigemMedia::tryFrom($origem) ?? OrigemMedia::MANUAL) : $origem;
        $this->status = is_string($status) ? (StatusMediaItem::tryFrom($status) ?? StatusMediaItem::RECEBIDO) : $status;
        $this->caminhoLocal = null;
        $this->googlePhotosMediaId = null;
        $this->categoriaId = null;
        $this->metadata = [];
        $this->erroMotivo = null;
        $agora = new \DateTimeImmutable();
        $this->criadoEm = $agora;
        $this->atualizadoEm = $agora;
        $this->historicoStatus = [
            [
                'para' => $this->status->value,
                'em' => $agora->format(\DateTimeInterface::ATOM),
            ],
        ];
    }

    public static function fromDTO(CriarMediaItemDTO $dto): self
    {
        $item = new self(
            hash: $dto->hash(),
            origem: $dto->origem(),
            status: $dto->status(),
        );

        if (null !== $dto->caminhoLocal()) {
            $item->setCaminhoLocal($dto->caminhoLocal());
        }

        if (null !== $dto->googlePhotosMediaId()) {
            $item->setGooglePhotosMediaId($dto->googlePhotosMediaId());
        }

        if (null !== $dto->categoriaId()) {
            $item->setCategoriaId($dto->categoriaId());
        }

        if (!empty($dto->metadata())) {
            $item->setMetadata($dto->metadata());
        }

        return $item;
    }

    public function uuid(): ?Uuid
    {
        return $this->uuid;
    }

    public function hash(): string
    {
        return $this->hash;
    }

    public function setHash(string $hash): self
    {
        $this->hash = $hash;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
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

    public function status(): StatusMediaItem
    {
        return $this->status;
    }

    public function transicionarPara(StatusMediaItem|string $novoStatus): self
    {
        $statusAlvo = is_string($novoStatus) ? (StatusMediaItem::tryFrom($novoStatus) ?? StatusMediaItem::ERRO) : $novoStatus;

        if (!$this->status->podeTransicionarPara($statusAlvo)) {
            throw new \DomainException(sprintf('Transição de status inválida de "%s" para "%s".', $this->status->value, $statusAlvo->value), 422);
        }

        $deStatus = $this->status->value;
        $this->status = $statusAlvo;
        $agora = new \DateTimeImmutable();
        $this->atualizadoEm = $agora;

        $this->historicoStatus[] = [
            'de' => $deStatus,
            'para' => $statusAlvo->value,
            'em' => $agora->format(\DateTimeInterface::ATOM),
        ];

        return $this;
    }

    /**
     * @return array<int, array{de?: string, para: string, em: string}>
     */
    public function historicoStatus(): array
    {
        return $this->historicoStatus;
    }

    public function setStatus(StatusMediaItem|string $status): self
    {
        return $this->transicionarPara($status);
    }

    public function caminhoLocal(): ?string
    {
        return $this->caminhoLocal;
    }

    public function setCaminhoLocal(?string $caminhoLocal): self
    {
        $this->caminhoLocal = $caminhoLocal;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function googlePhotosMediaId(): ?string
    {
        return $this->googlePhotosMediaId;
    }

    public function setGooglePhotosMediaId(?string $googlePhotosMediaId): self
    {
        $this->googlePhotosMediaId = $googlePhotosMediaId;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function categoriaId(): ?string
    {
        return $this->categoriaId;
    }

    public function setCategoriaId(?string $categoriaId): self
    {
        $this->categoriaId = $categoriaId;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function metadata(): array
    {
        return $this->metadata;
    }

    /**
     * @param array<string, mixed> $metadata
     */
    public function setMetadata(array $metadata): self
    {
        $this->metadata = $metadata;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function erroMotivo(): ?string
    {
        return $this->erroMotivo;
    }

    public function setErroMotivo(?string $erroMotivo): self
    {
        $this->erroMotivo = $erroMotivo;
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
