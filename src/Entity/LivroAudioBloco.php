<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\StatusLivroAudioBloco;
use App\Repository\LivroAudioBlocoRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: LivroAudioBlocoRepository::class)]
#[ORM\Table(name: 'livro_audio_bloco')]
#[ORM\UniqueConstraint(name: 'UNIQ_LIVRO_BLOCO_NUMERO', fields: ['livro', 'numeroBloco'])]
#[ORM\Index(name: 'IDX_BLOCO_AUDIO_STATUS', fields: ['status'])]
#[ORM\Index(name: 'IDX_BLOCO_AUDIO_LIVRO', fields: ['livro'])]
class LivroAudioBloco
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: LivroAudio::class, inversedBy: 'blocos')]
    #[ORM\JoinColumn(name: 'livro_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private LivroAudio $livro;

    #[ORM\Column(type: 'integer')]
    private int $numeroBloco;

    #[ORM\Column(type: 'integer')]
    private int $paginaInicio;

    #[ORM\Column(type: 'integer')]
    private int $paginaFim;

    #[ORM\Column(type: 'text')]
    private string $texto;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $caminhoAudio = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $duracaoSegundos = null;

    #[ORM\Column(type: 'bigint', nullable: true)]
    private ?int $tamanhoBytes = null;

    #[ORM\Column(type: 'string', length: 64, nullable: true)]
    private ?string $voz = null;

    /**
     * @var list<array{inicio: float, fim: float, texto: string, palavras?: list<array{inicio: float, fim: float, texto: string}>}>|null
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $trechos = null;

    #[ORM\Column(type: 'string', enumType: StatusLivroAudioBloco::class)]
    private StatusLivroAudioBloco $status;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $erroMotivo = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $atualizadoEm;

    public function __construct(
        LivroAudio $livro,
        int $numeroBloco,
        int $paginaInicio,
        int $paginaFim,
        string $texto,
    ) {
        $this->uuid = Uuid::v7();
        $this->livro = $livro;
        $this->numeroBloco = $numeroBloco;
        $this->paginaInicio = $paginaInicio;
        $this->paginaFim = $paginaFim;
        $this->texto = $texto;
        $this->status = StatusLivroAudioBloco::PENDENTE;
        $this->criadoEm = new DateTimeImmutable();
        $this->atualizadoEm = new DateTimeImmutable();
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

    public function numeroBloco(): int
    {
        return $this->numeroBloco;
    }

    public function paginaInicio(): int
    {
        return $this->paginaInicio;
    }

    public function paginaFim(): int
    {
        return $this->paginaFim;
    }

    public function texto(): string
    {
        return $this->texto;
    }

    public function caminhoAudio(): ?string
    {
        return $this->caminhoAudio;
    }

    public function duracaoSegundos(): ?int
    {
        return $this->duracaoSegundos;
    }

    public function tamanhoBytes(): ?int
    {
        return $this->tamanhoBytes;
    }

    public function status(): StatusLivroAudioBloco
    {
        return $this->status;
    }

    public function erroMotivo(): ?string
    {
        return $this->erroMotivo;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function atualizadoEm(): DateTimeImmutable
    {
        return $this->atualizadoEm;
    }

    public function iniciarGeracao(): self
    {
        $this->status = StatusLivroAudioBloco::GERANDO;
        $this->erroMotivo = null;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    /**
     * @param list<array{inicio: float, fim: float, texto: string, palavras?: list<array{inicio: float, fim: float, texto: string}>}> $trechos
     */
    public function concluirGeracao(string $caminhoAudio, int $duracaoSegundos, int $tamanhoBytes, string $voz, array $trechos): self
    {
        $this->caminhoAudio = $caminhoAudio;
        $this->voz = $voz;
        $this->trechos = [] !== $trechos ? $trechos : null;
        $this->duracaoSegundos = $duracaoSegundos;
        $this->tamanhoBytes = $tamanhoBytes;
        $this->status = StatusLivroAudioBloco::PRONTO;
        $this->erroMotivo = null;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function reiniciarGeracao(): self
    {
        $this->caminhoAudio = null;
        $this->duracaoSegundos = null;
        $this->tamanhoBytes = null;
        $this->voz = null;
        $this->trechos = null;
        $this->status = StatusLivroAudioBloco::PENDENTE;
        $this->erroMotivo = null;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function foiGeradoComVoz(string $voz): bool
    {
        return $this->voz === $voz;
    }

    /**
     * @return list<array{inicio: float, fim: float, texto: string, palavras?: list<array{inicio: float, fim: float, texto: string}>}>
     */
    public function trechos(): array
    {
        return $this->trechos ?? [];
    }

    public function possuiTrechos(): bool
    {
        return null !== $this->trechos && [] !== $this->trechos;
    }

    public function possuiPalavras(): bool
    {
        $primeiroTrecho = $this->trechos[0] ?? null;

        return is_array($primeiroTrecho) && [] !== ($primeiroTrecho['palavras'] ?? []);
    }

    public function registrarFalha(string $motivo): self
    {
        $this->status = StatusLivroAudioBloco::ERRO;
        $this->erroMotivo = $motivo;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function isPendente(): bool
    {
        return $this->status->isPendente();
    }

    public function isGerando(): bool
    {
        return $this->status->isGerando();
    }

    public function isPronto(): bool
    {
        return $this->status->isPronto();
    }

    public function isErro(): bool
    {
        return $this->status->isErro();
    }

    public function isFinal(): bool
    {
        return $this->status->isFinal();
    }
}
