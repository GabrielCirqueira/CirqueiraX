<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\StatusLivroAudioBloco;
use App\Repository\LivroAudioBlocoVozRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: LivroAudioBlocoVozRepository::class)]
#[ORM\Table(name: 'livro_audio_bloco_voz')]
#[ORM\UniqueConstraint(name: 'UNIQ_BLOCO_VOZ', fields: ['bloco', 'voz'])]
#[ORM\Index(name: 'IDX_BLOCO_VOZ_BLOCO', fields: ['bloco'])]
class LivroAudioBlocoVoz
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: LivroAudioBloco::class)]
    #[ORM\JoinColumn(name: 'bloco_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private LivroAudioBloco $bloco;

    #[ORM\Column(type: 'string', length: 64)]
    private string $voz;

    #[ORM\Column(type: 'string', enumType: StatusLivroAudioBloco::class)]
    private StatusLivroAudioBloco $status;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $caminhoAudio = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $duracaoSegundos = null;

    #[ORM\Column(type: 'bigint', nullable: true)]
    private ?int $tamanhoBytes = null;

    /**
     * @var list<array{inicio: float, fim: float, texto: string, palavras?: list<array{inicio: float, fim: float, texto: string}>}>|null
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $trechos = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $erroMotivo = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $atualizadoEm;

    public function __construct(LivroAudioBloco $bloco, string $voz)
    {
        $this->uuid = Uuid::v7();
        $this->bloco = $bloco;
        $this->voz = $voz;
        $this->status = StatusLivroAudioBloco::PENDENTE;
        $this->criadoEm = new DateTimeImmutable();
        $this->atualizadoEm = new DateTimeImmutable();
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
    public function concluirGeracao(string $caminhoAudio, int $duracaoSegundos, int $tamanhoBytes, array $trechos): self
    {
        $this->caminhoAudio = $caminhoAudio;
        $this->duracaoSegundos = $duracaoSegundos;
        $this->tamanhoBytes = $tamanhoBytes;
        $this->trechos = [] !== $trechos ? $trechos : null;
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
        $this->trechos = null;
        $this->status = StatusLivroAudioBloco::PENDENTE;
        $this->erroMotivo = null;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function registrarFalha(string $motivo): self
    {
        $this->status = StatusLivroAudioBloco::ERRO;
        $this->erroMotivo = $motivo;
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

    public function bloco(): LivroAudioBloco
    {
        return $this->bloco;
    }

    public function voz(): string
    {
        return $this->voz;
    }

    public function status(): StatusLivroAudioBloco
    {
        return $this->status;
    }

    public function isPendente(): bool
    {
        return $this->status->isPendente();
    }

    public function isPronto(): bool
    {
        return $this->status->isPronto();
    }

    public function isErro(): bool
    {
        return $this->status->isErro();
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

    /**
     * @return list<array{inicio: float, fim: float, texto: string, palavras?: list<array{inicio: float, fim: float, texto: string}>}>
     */
    public function trechos(): array
    {
        return $this->trechos ?? [];
    }

    public function erroMotivo(): ?string
    {
        return $this->erroMotivo;
    }
}
