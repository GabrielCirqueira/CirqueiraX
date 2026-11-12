<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\DuplicataDescartadaRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: DuplicataDescartadaRepository::class)]
#[ORM\Table(name: 'duplicata_descartada')]
#[ORM\UniqueConstraint(name: 'UNIQ_DUPLICATA_DESCARTADA_PAR', fields: ['usuario', 'primeiraMusica', 'segundaMusica'])]
class DuplicataDescartada
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\ManyToOne(targetEntity: MusicaCatalogo::class)]
    #[ORM\JoinColumn(name: 'primeira_musica_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private MusicaCatalogo $primeiraMusica;

    #[ORM\ManyToOne(targetEntity: MusicaCatalogo::class)]
    #[ORM\JoinColumn(name: 'segunda_musica_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private MusicaCatalogo $segundaMusica;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadoEm;

    public function __construct(Usuario $usuario, MusicaCatalogo $primeiraMusica, MusicaCatalogo $segundaMusica)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->primeiraMusica = $primeiraMusica;
        $this->segundaMusica = $segundaMusica;
        $this->criadoEm = new \DateTimeImmutable();
    }

    public static function chavePar(string $primeiraUuid, string $segundaUuid): string
    {
        $uuids = [$primeiraUuid, $segundaUuid];
        sort($uuids);

        return implode('|', $uuids);
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function primeiraMusica(): MusicaCatalogo
    {
        return $this->primeiraMusica;
    }

    public function segundaMusica(): MusicaCatalogo
    {
        return $this->segundaMusica;
    }

    public function criadoEm(): \DateTimeImmutable
    {
        return $this->criadoEm;
    }
}
