<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\ConsultaPronunciaRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ConsultaPronunciaRepository::class)]
#[ORM\Table(name: 'consulta_pronuncia')]
#[ORM\UniqueConstraint(name: 'UNIQ_CONSULTA_PRONUNCIA_USUARIO_FRASE', fields: ['usuario', 'frase'])]
#[ORM\Index(name: 'IDX_CONSULTA_PRONUNCIA_USUARIO_ULTIMA', fields: ['usuario', 'ultimaConsultaEm'])]
class ConsultaPronuncia
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\ManyToOne(targetEntity: FrasePronuncia::class)]
    #[ORM\JoinColumn(name: 'frase_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private FrasePronuncia $frase;

    #[ORM\Column(type: 'boolean')]
    private bool $favorita;

    #[ORM\Column(type: 'integer')]
    private int $vezesConsultada;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadaEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $ultimaConsultaEm;

    public function __construct(Usuario $usuario, FrasePronuncia $frase)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->frase = $frase;
        $this->favorita = false;
        $this->vezesConsultada = 1;
        $this->criadaEm = new \DateTimeImmutable();
        $this->ultimaConsultaEm = $this->criadaEm;
    }

    public function registrarNovaConsulta(): void
    {
        ++$this->vezesConsultada;
        $this->ultimaConsultaEm = new \DateTimeImmutable();
    }

    public function definirFavorita(bool $favorita): void
    {
        $this->favorita = $favorita;
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function frase(): FrasePronuncia
    {
        return $this->frase;
    }

    public function isFavorita(): bool
    {
        return $this->favorita;
    }

    public function vezesConsultada(): int
    {
        return $this->vezesConsultada;
    }

    public function criadaEm(): \DateTimeImmutable
    {
        return $this->criadaEm;
    }

    public function ultimaConsultaEm(): \DateTimeImmutable
    {
        return $this->ultimaConsultaEm;
    }
}
