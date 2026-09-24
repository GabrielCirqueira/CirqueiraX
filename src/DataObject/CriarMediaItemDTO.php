<?php

declare(strict_types=1);

namespace App\DataObject;

use App\Enum\OrigemMedia;
use App\Enum\StatusMediaItem;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class CriarMediaItemDTO
{
    public OrigemMedia $origem;
    public StatusMediaItem $status;

    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 64)]
        public string $hash,

        OrigemMedia|string $origem,

        StatusMediaItem|string $status = StatusMediaItem::RECEBIDO,

        public ?string $caminhoLocal = null,

        public ?string $googlePhotosMediaId = null,

        public ?string $categoriaId = null,

        public array $metadata = [],
    ) {
        $this->origem = is_string($origem) ? (OrigemMedia::tryFrom($origem) ?? OrigemMedia::MANUAL) : $origem;
        $this->status = is_string($status) ? (StatusMediaItem::tryFrom($status) ?? StatusMediaItem::RECEBIDO) : $status;
    }

    public function hash(): string
    {
        return $this->hash;
    }

    public function origem(): OrigemMedia
    {
        return $this->origem;
    }

    public function status(): StatusMediaItem
    {
        return $this->status;
    }

    public function caminhoLocal(): ?string
    {
        return $this->caminhoLocal;
    }

    public function googlePhotosMediaId(): ?string
    {
        return $this->googlePhotosMediaId;
    }

    public function categoriaId(): ?string
    {
        return $this->categoriaId;
    }

    /**
     * @return array<string, mixed>
     */
    public function metadata(): array
    {
        return $this->metadata;
    }
}
