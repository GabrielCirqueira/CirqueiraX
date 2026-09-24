<?php

declare(strict_types=1);

namespace App\DataObject;

use App\Enum\OrigemMedia;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class AtualizarOrigemRegraDTO
{
    public ?OrigemMedia $origem;

    public function __construct(
        OrigemMedia|string|null $origem = null,

        #[Assert\Length(max: 36)]
        public ?string $categoriaId = null,
    ) {
        $this->origem = is_string($origem) ? (OrigemMedia::tryFrom($origem) ?? null) : $origem;
    }

    public function origem(): ?OrigemMedia
    {
        return $this->origem;
    }

    public function categoriaId(): ?string
    {
        return $this->categoriaId;
    }
}
