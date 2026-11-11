<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\OrigemConsultaSpotify;
use App\Repository\BloqueioSpotifyRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BloqueioSpotifyRepository::class)]
#[ORM\Table(name: 'bloqueio_spotify')]
#[ORM\Index(name: 'IDX_BLOQUEIO_SPOTIFY_OCORRIDO_EM', fields: ['ocorridoEm'])]
class BloqueioSpotify
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $ocorridoEm;

    #[ORM\Column(type: 'integer')]
    private int $segundosEspera;

    #[ORM\Column(type: 'string', length: 40, enumType: OrigemConsultaSpotify::class)]
    private OrigemConsultaSpotify $origem;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $liberadoEm;

    #[ORM\Column(type: 'integer')]
    private int $consultasDesdeUltimoBloqueio;

    #[ORM\Column(type: 'integer')]
    private int $intervaloEntreConsultasSegundos;

    /**
     * @var array<string, int>|null
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $consultasPorOrigemUltimas24h = null;

    /**
     * @param array<string, int> $consultasPorOrigemUltimas24h
     */
    public function __construct(
        int $segundosEspera,
        int $segundosAteLiberar,
        OrigemConsultaSpotify $origem,
        int $consultasDesdeUltimoBloqueio,
        int $intervaloEntreConsultasSegundos,
        array $consultasPorOrigemUltimas24h,
    ) {
        $this->ocorridoEm = new DateTimeImmutable();
        $this->liberadoEm = $this->ocorridoEm->modify(sprintf('+%d seconds', $segundosAteLiberar));
        $this->segundosEspera = $segundosEspera;
        $this->origem = $origem;
        $this->consultasDesdeUltimoBloqueio = $consultasDesdeUltimoBloqueio;
        $this->intervaloEntreConsultasSegundos = $intervaloEntreConsultasSegundos;
        $this->consultasPorOrigemUltimas24h = $consultasPorOrigemUltimas24h;
    }

    public function isAtivo(DateTimeImmutable $agora): bool
    {
        return $this->liberadoEm > $agora;
    }

    public function id(): ?int
    {
        return $this->id;
    }

    public function ocorridoEm(): DateTimeImmutable
    {
        return $this->ocorridoEm;
    }

    public function segundosEspera(): int
    {
        return $this->segundosEspera;
    }

    public function liberadoEm(): DateTimeImmutable
    {
        return $this->liberadoEm;
    }

    public function origem(): OrigemConsultaSpotify
    {
        return $this->origem;
    }

    public function consultasDesdeUltimoBloqueio(): int
    {
        return $this->consultasDesdeUltimoBloqueio;
    }

    public function intervaloEntreConsultasSegundos(): int
    {
        return $this->intervaloEntreConsultasSegundos;
    }

    /**
     * @return array<string, int>
     */
    public function consultasPorOrigemUltimas24h(): array
    {
        return $this->consultasPorOrigemUltimas24h ?? [];
    }
}
