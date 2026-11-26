<?php

declare(strict_types=1);

namespace App\Entity;

use App\DataObject\Pronuncia\LetraEncontradaDTO;
use App\DataObject\Pronuncia\LinhaLetraDTO;
use App\Enum\SituacaoLetraMusica;
use App\Repository\LetraMusicaPronunciaRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: LetraMusicaPronunciaRepository::class)]
#[ORM\Table(name: 'letra_musica_pronuncia')]
#[ORM\UniqueConstraint(name: 'UNIQ_LETRA_MUSICA_CODIGO_FAIXA', fields: ['codigoFaixa'])]
class LetraMusicaPronuncia
{
    private const string NOVA_BUSCA_SEM_LETRA = '-3 days';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\Column(type: 'string', length: 64)]
    private string $codigoFaixa;

    #[ORM\Column(type: 'string', length: 255)]
    private string $titulo;

    #[ORM\Column(type: 'string', length: 255)]
    private string $artista;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $album;

    #[ORM\Column(type: 'integer')]
    private int $duracaoMs;

    #[ORM\Column(type: 'string', length: 20, enumType: SituacaoLetraMusica::class)]
    private SituacaoLetraMusica $situacao;

    /**
     * @var list<array{inicioMs: int|null, texto: string}>
     */
    #[ORM\Column(type: 'json')]
    private array $linhas = [];

    /**
     * @var list<string>|null
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $traducoes = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $buscadaEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadaEm;

    public function __construct(string $codigoFaixa, string $titulo, string $artista, ?string $album, int $duracaoMs, LetraEncontradaDTO $letra)
    {
        $this->uuid = Uuid::v7();
        $this->codigoFaixa = $codigoFaixa;
        $this->titulo = $titulo;
        $this->artista = $artista;
        $this->album = $album;
        $this->duracaoMs = $duracaoMs;
        $this->criadaEm = new \DateTimeImmutable();
        $this->atualizarLetra($letra);
    }

    public function atualizarLetra(LetraEncontradaDTO $letra): void
    {
        $this->situacao = $letra->situacao;
        $this->linhas = array_map(static fn (LinhaLetraDTO $linha): array => $linha->paraArray(), $letra->linhas);
        $this->traducoes = null;
        $this->buscadaEm = new \DateTimeImmutable();
    }

    /**
     * Uma letra não achada vale ser procurada de novo quando o nome chega diferente, como no YouTube Music, que primeiro manda o título do vídeo e depois o da música identificada.
     */
    public function isOutraBuscaSemLetra(string $titulo, string $artista): bool
    {
        return $this->situacao->isNaoEncontrada() && ($titulo !== $this->titulo || $artista !== $this->artista);
    }

    public function trocarBusca(string $titulo, string $artista, ?string $album, int $duracaoMs, LetraEncontradaDTO $letra): void
    {
        $this->titulo = $titulo;
        $this->artista = $artista;
        $this->album = $album;
        $this->duracaoMs = $duracaoMs;
        $this->atualizarLetra($letra);
    }

    public function isHoraDeBuscarDeNovo(): bool
    {
        return $this->situacao->isNaoEncontrada() && $this->buscadaEm < new \DateTimeImmutable(self::NOVA_BUSCA_SEM_LETRA);
    }

    /**
     * @param list<string> $traducoes
     */
    public function definirTraducoes(array $traducoes): void
    {
        $this->traducoes = $traducoes;
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function codigoFaixa(): string
    {
        return $this->codigoFaixa;
    }

    public function titulo(): string
    {
        return $this->titulo;
    }

    public function artista(): string
    {
        return $this->artista;
    }

    public function album(): ?string
    {
        return $this->album;
    }

    public function duracaoMs(): int
    {
        return $this->duracaoMs;
    }

    public function situacao(): SituacaoLetraMusica
    {
        return $this->situacao;
    }

    /**
     * @return list<LinhaLetraDTO>
     */
    public function linhas(): array
    {
        return array_map(static fn (array $linha): LinhaLetraDTO => LinhaLetraDTO::doArray($linha), $this->linhas);
    }

    /**
     * @return list<string>
     */
    public function textosDasLinhas(): array
    {
        return array_map(static fn (array $linha): string => $linha['texto'], $this->linhas);
    }

    /**
     * @return list<string>|null
     */
    public function traducoes(): ?array
    {
        return $this->traducoes;
    }

    public function isTraduzida(): bool
    {
        return null !== $this->traducoes;
    }
}
