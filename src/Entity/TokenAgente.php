<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\TipoCliente;
use App\Repository\TokenAgenteRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: TokenAgenteRepository::class)]
#[ORM\Table(name: 'token_agente')]
#[ORM\UniqueConstraint(name: 'UNIQ_TOKEN_AGENTE_HASH', fields: ['tokenHash'])]
class TokenAgente
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private ?Uuid $uuid = null;

    #[ORM\Column(type: 'string', length: 100)]
    private string $nome;

    #[ORM\Column(type: 'string', length: 64, unique: true)]
    private string $tokenHash;

    #[ORM\Column(type: 'string', length: 50)]
    private string $origem;

    #[ORM\Column(type: 'string', enumType: TipoCliente::class)]
    private TipoCliente $tipoCliente;

    #[ORM\Column(type: 'boolean')]
    private bool $ativo;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $atualizadoEm;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $revogadoEm = null;

    public function __construct(
        string $nome,
        string $tokenHash,
        string $origem,
        TipoCliente $tipoCliente = TipoCliente::AGENTE,
    ) {
        $this->uuid = Uuid::v7();
        $this->nome = $nome;
        $this->tokenHash = $tokenHash;
        $this->origem = $origem;
        $this->tipoCliente = $tipoCliente;
        $this->ativo = true;
        $this->criadoEm = new \DateTimeImmutable();
        $this->atualizadoEm = new \DateTimeImmutable();
        $this->revogadoEm = null;
    }

    public function uuid(): ?Uuid
    {
        return $this->uuid;
    }

    public function nome(): string
    {
        return $this->nome;
    }

    public function setNome(string $nome): self
    {
        $this->nome = $nome;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function tokenHash(): string
    {
        return $this->tokenHash;
    }

    public function setTokenHash(string $tokenHash): self
    {
        $this->tokenHash = $tokenHash;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function origem(): string
    {
        return $this->origem;
    }

    public function setOrigem(string $origem): self
    {
        $this->origem = $origem;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function tipoCliente(): TipoCliente
    {
        return $this->tipoCliente;
    }

    public function setTipoCliente(TipoCliente $tipoCliente): self
    {
        $this->tipoCliente = $tipoCliente;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function ativo(): bool
    {
        return $this->ativo;
    }

    public function setAtivo(bool $ativo): self
    {
        $this->ativo = $ativo;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function revogar(): self
    {
        $this->ativo = false;
        $this->revogadoEm = new \DateTimeImmutable();
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

    public function revogadoEm(): ?\DateTimeImmutable
    {
        return $this->revogadoEm;
    }
}
