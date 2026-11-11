<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\CotaYoutubeDataDiaRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: CotaYoutubeDataDiaRepository::class)]
#[ORM\Table(name: 'cota_youtube_data_dia')]
#[ORM\UniqueConstraint(name: 'UNIQ_COTA_YOUTUBE_DATA_DIA', fields: ['dia'])]
class CotaYoutubeDataDia
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $uuid = null;

    #[ORM\Column(type: 'date_immutable')]
    private DateTimeImmutable $dia;

    #[ORM\Column(type: 'integer')]
    private int $unidadesUsadas = 0;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $excedidaEm = null;

    public function __construct(DateTimeImmutable $dia)
    {
        $this->dia = $dia;
    }

    public function uuid(): ?Uuid
    {
        return $this->uuid;
    }

    public function dia(): DateTimeImmutable
    {
        return $this->dia;
    }

    public function unidadesUsadas(): int
    {
        return $this->unidadesUsadas;
    }

    public function excedidaEm(): ?DateTimeImmutable
    {
        return $this->excedidaEm;
    }
}
