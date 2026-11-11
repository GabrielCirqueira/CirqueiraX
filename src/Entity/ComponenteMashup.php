<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\ComponenteMashupRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ComponenteMashupRepository::class)]
#[ORM\Table(name: 'componente_mashup')]
class ComponenteMashup
{
    private const int TAMANHO_MAXIMO_TEXTO = 500;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: MusicaCatalogo::class, inversedBy: 'componentes')]
    #[ORM\JoinColumn(name: 'mashup_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private MusicaCatalogo $mashup;

    #[ORM\Column(type: 'string', length: 500)]
    private string $texto;

    #[ORM\ManyToOne(targetEntity: MusicaCatalogo::class)]
    #[ORM\JoinColumn(name: 'musica_componente_uuid', referencedColumnName: 'uuid', nullable: true, onDelete: 'SET NULL')]
    private ?MusicaCatalogo $musicaComponente;

    #[ORM\Column(type: 'smallint')]
    private int $posicao;

    public function __construct(MusicaCatalogo $mashup, string $texto, ?MusicaCatalogo $musicaComponente, int $posicao)
    {
        $this->uuid = Uuid::v7();
        $this->mashup = $mashup;
        $this->texto = mb_substr($texto, 0, self::TAMANHO_MAXIMO_TEXTO);
        $this->musicaComponente = $musicaComponente;
        $this->posicao = $posicao;
    }

    public function vincularMusica(MusicaCatalogo $musica): self
    {
        $this->musicaComponente = $musica;

        return $this;
    }

    public function isIdentificado(): bool
    {
        return null !== $this->musicaComponente;
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function mashup(): MusicaCatalogo
    {
        return $this->mashup;
    }

    public function texto(): string
    {
        return $this->texto;
    }

    public function musicaComponente(): ?MusicaCatalogo
    {
        return $this->musicaComponente;
    }

    public function posicao(): int
    {
        return $this->posicao;
    }
}
