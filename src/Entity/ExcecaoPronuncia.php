<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\OrigemExcecaoPronuncia;
use App\Repository\ExcecaoPronunciaRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ExcecaoPronunciaRepository::class)]
#[ORM\Table(name: 'excecao_pronuncia')]
#[ORM\UniqueConstraint(name: 'UNIQ_EXCECAO_PRONUNCIA_PALAVRA', fields: ['palavra'])]
class ExcecaoPronuncia
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\Column(type: 'string', length: 80)]
    private string $palavra;

    #[ORM\Column(type: 'string', length: 120)]
    private string $pronuncia;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $observacao;

    #[ORM\Column(type: 'string', length: 20, enumType: OrigemExcecaoPronuncia::class)]
    private OrigemExcecaoPronuncia $origem;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadaEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $atualizadaEm;

    public function __construct(string $palavra, string $pronuncia, ?string $observacao, OrigemExcecaoPronuncia $origem)
    {
        $this->uuid = Uuid::v7();
        $this->palavra = $palavra;
        $this->pronuncia = $pronuncia;
        $this->observacao = $observacao;
        $this->origem = $origem;
        $this->criadaEm = new \DateTimeImmutable();
        $this->atualizadaEm = $this->criadaEm;
    }

    public function corrigirPara(string $pronuncia, ?string $observacao, OrigemExcecaoPronuncia $origem): void
    {
        $this->pronuncia = $pronuncia;
        $this->observacao = $observacao;
        $this->origem = $origem;
        $this->atualizadaEm = new \DateTimeImmutable();
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function palavra(): string
    {
        return $this->palavra;
    }

    public function pronuncia(): string
    {
        return $this->pronuncia;
    }

    public function observacao(): ?string
    {
        return $this->observacao;
    }

    public function origem(): OrigemExcecaoPronuncia
    {
        return $this->origem;
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
