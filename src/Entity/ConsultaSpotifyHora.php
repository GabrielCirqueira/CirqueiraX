<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\OrigemConsultaSpotify;
use App\Repository\ConsultaSpotifyHoraRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ConsultaSpotifyHoraRepository::class)]
#[ORM\Table(name: 'consulta_spotify_hora')]
#[ORM\UniqueConstraint(name: 'UNIQ_CONSULTA_SPOTIFY_HORA_ORIGEM', fields: ['hora', 'origem'])]
class ConsultaSpotifyHora
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $uuid = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $hora;

    #[ORM\Column(type: 'string', length: 40, enumType: OrigemConsultaSpotify::class)]
    private OrigemConsultaSpotify $origem;

    #[ORM\Column(type: 'integer')]
    private int $total = 0;

    public function __construct(DateTimeImmutable $hora, OrigemConsultaSpotify $origem)
    {
        $this->hora = $hora;
        $this->origem = $origem;
    }

    public function uuid(): ?Uuid
    {
        return $this->uuid;
    }

    public function hora(): DateTimeImmutable
    {
        return $this->hora;
    }

    public function origem(): OrigemConsultaSpotify
    {
        return $this->origem;
    }

    public function total(): int
    {
        return $this->total;
    }
}
