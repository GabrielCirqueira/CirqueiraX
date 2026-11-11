<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\FinalidadeConsumoIa;
use App\Repository\ConsumoIaRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ConsumoIaRepository::class)]
#[ORM\Table(name: 'consumo_ia')]
#[ORM\Index(name: 'IDX_CONSUMO_IA_USUARIO_CRIADO', fields: ['usuario', 'criadoEm'])]
#[ORM\Index(name: 'IDX_CONSUMO_IA_FINALIDADE_CRIADO', fields: ['finalidade', 'criadoEm'])]
class ConsumoIa
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Usuario $usuario;

    #[ORM\Column(type: 'string', length: 40, enumType: FinalidadeConsumoIa::class)]
    private FinalidadeConsumoIa $finalidade;

    #[ORM\Column(type: 'string', length: 80)]
    private string $modelo;

    #[ORM\Column(type: 'integer')]
    private int $tokensEntrada;

    #[ORM\Column(type: 'integer')]
    private int $tokensSaida;

    #[ORM\Column(type: 'integer')]
    private int $custoMicrodolares;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    public function __construct(?Usuario $usuario, FinalidadeConsumoIa $finalidade, string $modelo, int $tokensEntrada, int $tokensSaida, int $custoMicrodolares)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->finalidade = $finalidade;
        $this->modelo = $modelo;
        $this->tokensEntrada = $tokensEntrada;
        $this->tokensSaida = $tokensSaida;
        $this->custoMicrodolares = $custoMicrodolares;
        $this->criadoEm = new DateTimeImmutable();
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): ?Usuario
    {
        return $this->usuario;
    }

    public function finalidade(): FinalidadeConsumoIa
    {
        return $this->finalidade;
    }

    public function modelo(): string
    {
        return $this->modelo;
    }

    public function tokensEntrada(): int
    {
        return $this->tokensEntrada;
    }

    public function tokensSaida(): int
    {
        return $this->tokensSaida;
    }

    public function custoMicrodolares(): int
    {
        return $this->custoMicrodolares;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }
}
