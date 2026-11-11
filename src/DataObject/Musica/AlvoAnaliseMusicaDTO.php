<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use Symfony\Component\Uid\Uuid;

final readonly class AlvoAnaliseMusicaDTO
{
    private function __construct(
        public ?Uuid $musica,
        public ?Uuid $artista,
    ) {}

    public static function daMusica(Uuid $musica): self
    {
        return new self($musica, null);
    }

    public static function doArtista(Uuid $artista): self
    {
        return new self(null, $artista);
    }

    public function isMusica(): bool
    {
        return null !== $this->musica;
    }

    public function chaveCache(): string
    {
        return null !== $this->musica ? 'musica:'.$this->musica->toRfc4122() : 'artista:'.$this->artista?->toRfc4122();
    }
}
