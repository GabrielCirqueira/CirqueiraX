<?php

declare(strict_types=1);

namespace App\DataObject;

use App\Enum\OrigemMedia;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class CriarOrigemRegraDTO
{
    public OrigemMedia $origem;

    public function __construct(
        OrigemMedia|string $origem,

        #[Assert\NotBlank]
        #[Assert\Length(max: 36)]
        public string $categoriaId,
    ) {
        $this->origem = is_string($origem) ? (OrigemMedia::tryFrom($origem) ?? OrigemMedia::MANUAL) : $origem;
    }

    public function origem(): OrigemMedia
    {
        return $this->origem;
    }

    public function categoriaId(): string
    {
        return $this->categoriaId;
    }
}
