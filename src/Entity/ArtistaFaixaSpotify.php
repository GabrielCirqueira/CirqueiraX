<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\ArtistaFaixaSpotifyRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ArtistaFaixaSpotifyRepository::class)]
#[ORM\Table(name: 'artista_faixa_spotify')]
#[ORM\UniqueConstraint(name: 'UNIQ_ARTISTA_FAIXA_SPOTIFY_FAIXA_POSICAO', fields: ['codigoFaixa', 'posicao'])]
#[ORM\Index(name: 'IDX_ARTISTA_FAIXA_SPOTIFY_ARTISTA', fields: ['nomeArtista'])]
class ArtistaFaixaSpotify
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 64)]
    private string $codigoFaixa;

    #[ORM\Column(type: 'smallint')]
    private int $posicao;

    #[ORM\Column(type: 'string', length: 255)]
    private string $nomeArtista;

    #[ORM\Column(type: 'string', length: 64, nullable: true)]
    private ?string $codigoArtista;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    public function __construct(string $codigoFaixa, int $posicao, string $nomeArtista, ?string $codigoArtista)
    {
        $this->codigoFaixa = $codigoFaixa;
        $this->posicao = $posicao;
        $this->nomeArtista = $nomeArtista;
        $this->codigoArtista = $codigoArtista;
        $this->criadoEm = new DateTimeImmutable();
    }

    public function id(): ?int
    {
        return $this->id;
    }

    public function codigoFaixa(): string
    {
        return $this->codigoFaixa;
    }

    public function posicao(): int
    {
        return $this->posicao;
    }

    public function nomeArtista(): string
    {
        return $this->nomeArtista;
    }

    public function codigoArtista(): ?string
    {
        return $this->codigoArtista;
    }
}
