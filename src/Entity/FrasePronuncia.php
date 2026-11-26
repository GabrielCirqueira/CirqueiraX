<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\IdiomaFrase;
use App\Enum\StatusFrasePronuncia;
use App\Repository\FrasePronunciaRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: FrasePronunciaRepository::class)]
#[ORM\Table(name: 'frase_pronuncia')]
#[ORM\UniqueConstraint(name: 'UNIQ_FRASE_PRONUNCIA_HASH', fields: ['hashOrigem'])]
#[ORM\Index(name: 'IDX_FRASE_PRONUNCIA_STATUS', fields: ['status'])]
class FrasePronuncia
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\Column(type: 'string', length: 64)]
    private string $hashOrigem;

    #[ORM\Column(type: 'string', length: 2, enumType: IdiomaFrase::class)]
    private IdiomaFrase $idiomaOrigem;

    #[ORM\Column(type: 'text')]
    private string $textoPortugues;

    #[ORM\Column(type: 'text')]
    private string $textoIngles;

    /**
     * @var array<string, mixed>
     */
    #[ORM\Column(type: 'json')]
    private array $analise;

    #[ORM\Column(type: 'text')]
    private string $palavrasIndexadas;

    #[ORM\Column(type: 'string', length: 20, enumType: StatusFrasePronuncia::class)]
    private StatusFrasePronuncia $status;

    #[ORM\Column(type: 'integer')]
    private int $totalConsultas;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadaEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $atualizadaEm;

    /**
     * @param array<string, mixed> $analise
     */
    public function __construct(
        string $hashOrigem,
        IdiomaFrase $idiomaOrigem,
        string $textoPortugues,
        string $textoIngles,
        array $analise,
        string $palavrasIndexadas,
    ) {
        $this->uuid = Uuid::v7();
        $this->hashOrigem = $hashOrigem;
        $this->idiomaOrigem = $idiomaOrigem;
        $this->textoPortugues = $textoPortugues;
        $this->textoIngles = $textoIngles;
        $this->analise = $analise;
        $this->palavrasIndexadas = $palavrasIndexadas;
        $this->status = StatusFrasePronuncia::Ok;
        $this->totalConsultas = 1;
        $this->criadaEm = new \DateTimeImmutable();
        $this->atualizadaEm = $this->criadaEm;
    }

    public function registrarConsulta(): void
    {
        ++$this->totalConsultas;
    }

    public function retraduzir(IdiomaFrase $idiomaOrigem, string $textoPortugues, string $textoIngles): void
    {
        $this->idiomaOrigem = $idiomaOrigem;
        $this->textoPortugues = $textoPortugues;
        $this->textoIngles = $textoIngles;
        $this->atualizadaEm = new \DateTimeImmutable();
    }

    /**
     * @param array<string, mixed> $analise
     */
    public function atualizarAnalise(array $analise, string $palavrasIndexadas): void
    {
        $this->analise = $analise;
        $this->palavrasIndexadas = $palavrasIndexadas;
        $this->atualizadaEm = new \DateTimeImmutable();
    }

    public function corrigirTraducao(string $traducaoCorrigida): void
    {
        $this->atualizadaEm = new \DateTimeImmutable();
        if ($this->idiomaOrigem->isIngles()) {
            $this->textoPortugues = $traducaoCorrigida;

            return;
        }

        $this->textoIngles = $traducaoCorrigida;
    }

    public function traducao(): string
    {
        return $this->idiomaOrigem->isIngles() ? $this->textoPortugues : $this->textoIngles;
    }

    public function marcarComoReportada(): void
    {
        $this->status = StatusFrasePronuncia::Reportada;
    }

    public function marcarComoCorrigida(): void
    {
        $this->status = StatusFrasePronuncia::Corrigida;
        $this->atualizadaEm = new \DateTimeImmutable();
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function hashOrigem(): string
    {
        return $this->hashOrigem;
    }

    public function idiomaOrigem(): IdiomaFrase
    {
        return $this->idiomaOrigem;
    }

    public function textoPortugues(): string
    {
        return $this->textoPortugues;
    }

    public function textoIngles(): string
    {
        return $this->textoIngles;
    }

    /**
     * @return array<string, mixed>
     */
    public function analise(): array
    {
        return $this->analise;
    }

    public function pronunciaResumida(): string
    {
        $pronuncia = $this->analise['pronuncia'] ?? '';

        return is_string($pronuncia) ? $pronuncia : '';
    }

    public function pronunciaSimples(): string
    {
        $simples = $this->analise['simples'] ?? null;

        return is_string($simples) ? $simples : $this->pronunciaResumida();
    }

    public function status(): StatusFrasePronuncia
    {
        return $this->status;
    }

    public function totalConsultas(): int
    {
        return $this->totalConsultas;
    }

    public function criadaEm(): \DateTimeImmutable
    {
        return $this->criadaEm;
    }

    public function atualizadaEm(): \DateTimeImmutable
    {
        return $this->atualizadaEm;
    }
}
