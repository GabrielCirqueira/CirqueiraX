<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\PalavraDicionarioPronunciaRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PalavraDicionarioPronunciaRepository::class)]
#[ORM\Table(name: 'palavra_dicionario_pronuncia')]
#[ORM\UniqueConstraint(name: 'UNIQ_PALAVRA_DICIONARIO_VARIANTE', fields: ['palavra', 'variante'])]
class PalavraDicionarioPronuncia
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\Column(type: 'string', length: 80)]
    private string $palavra;

    #[ORM\Column(type: 'smallint')]
    private int $variante;

    #[ORM\Column(type: 'string', length: 255)]
    private string $fonemas;

    public function __construct(string $palavra, int $variante, string $fonemas)
    {
        $this->uuid = Uuid::v7();
        $this->palavra = $palavra;
        $this->variante = $variante;
        $this->fonemas = $fonemas;
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function palavra(): string
    {
        return $this->palavra;
    }

    public function variante(): int
    {
        return $this->variante;
    }

    public function fonemas(): string
    {
        return $this->fonemas;
    }
}
