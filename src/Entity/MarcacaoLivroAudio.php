<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\TipoMarcacaoLivroAudio;
use App\Repository\MarcacaoLivroAudioRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: MarcacaoLivroAudioRepository::class)]
#[ORM\Table(name: 'marcacao_livro_audio')]
#[ORM\Index(name: 'IDX_MARCACAO_LIVRO_PAGINA', fields: ['livro', 'pagina'])]
class MarcacaoLivroAudio
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: LivroAudio::class)]
    #[ORM\JoinColumn(name: 'livro_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private LivroAudio $livro;

    #[ORM\Column(type: 'string', length: 20, enumType: TipoMarcacaoLivroAudio::class)]
    private TipoMarcacaoLivroAudio $tipo;

    #[ORM\Column(type: 'integer')]
    private int $pagina;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $numeroBloco;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $indiceTrecho;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $segundos;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $texto;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $nota;

    /** @var list<array{pagina: int, esquerda: float, topo: float, largura: float, altura: float}>|null */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $retangulos;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $atualizadoEm;

    /**
     * @param list<array{pagina: int, esquerda: float, topo: float, largura: float, altura: float}> $retangulos
     */
    public function __construct(
        LivroAudio $livro,
        TipoMarcacaoLivroAudio $tipo,
        int $pagina,
        ?int $numeroBloco = null,
        ?int $indiceTrecho = null,
        ?float $segundos = null,
        ?string $texto = null,
        ?string $nota = null,
        array $retangulos = [],
    ) {
        $this->uuid = Uuid::v7();
        $this->livro = $livro;
        $this->tipo = $tipo;
        $this->pagina = $pagina;
        $this->numeroBloco = $numeroBloco;
        $this->indiceTrecho = $indiceTrecho;
        $this->segundos = $segundos;
        $this->texto = $texto;
        $this->nota = $nota;
        $this->retangulos = [] !== $retangulos ? $retangulos : null;
        $this->criadoEm = new DateTimeImmutable();
        $this->atualizadoEm = $this->criadoEm;
    }

    public function atualizarNota(?string $nota): self
    {
        $this->nota = $nota;
        if (null !== $nota && TipoMarcacaoLivroAudio::DESTAQUE === $this->tipo) {
            $this->tipo = TipoMarcacaoLivroAudio::NOTA;
        }
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function uuidTexto(): string
    {
        return $this->uuid->toRfc4122();
    }

    public function livro(): LivroAudio
    {
        return $this->livro;
    }

    public function tipo(): TipoMarcacaoLivroAudio
    {
        return $this->tipo;
    }

    public function pagina(): int
    {
        return $this->pagina;
    }

    public function numeroBloco(): ?int
    {
        return $this->numeroBloco;
    }

    public function indiceTrecho(): ?int
    {
        return $this->indiceTrecho;
    }

    public function segundos(): ?float
    {
        return $this->segundos;
    }

    public function texto(): ?string
    {
        return $this->texto;
    }

    public function nota(): ?string
    {
        return $this->nota;
    }

    /**
     * @return list<array{pagina: int, esquerda: float, topo: float, largura: float, altura: float}>
     */
    public function retangulos(): array
    {
        return $this->retangulos ?? [];
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function atualizadoEm(): DateTimeImmutable
    {
        return $this->atualizadoEm;
    }
}
