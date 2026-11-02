<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\StatusLivroAudio;
use App\Repository\LivroAudioRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: LivroAudioRepository::class)]
#[ORM\Table(name: 'livro_audio')]
#[ORM\Index(name: 'IDX_LIVRO_AUDIO_USUARIO_CRIADO_EM', fields: ['usuario', 'criadoEm'])]
#[ORM\Index(name: 'IDX_LIVRO_AUDIO_STATUS', fields: ['status'])]
class LivroAudio
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 255)]
    private string $titulo;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $caminhoPdf = null;

    #[ORM\Column(type: 'bigint', nullable: true)]
    private ?int $tamanhoBytes = null;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $totalPaginas = 0;

    #[ORM\Column(type: 'string', enumType: StatusLivroAudio::class)]
    private StatusLivroAudio $status;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $erroMotivo = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $atualizadoEm;

    public function __construct(
        Usuario $usuario,
        string $titulo,
        ?string $caminhoPdf = null,
        int $totalPaginas = 0,
        ?int $tamanhoBytes = null,
    ) {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->titulo = $titulo;
        $this->caminhoPdf = $caminhoPdf;
        $this->totalPaginas = max(0, $totalPaginas);
        $this->tamanhoBytes = $tamanhoBytes;
        $this->status = StatusLivroAudio::ENVIADO;
        $this->criadoEm = new DateTimeImmutable();
        $this->atualizadoEm = $this->criadoEm;
    }

    public function iniciarExtracao(): self
    {
        $this->erroMotivo = null;

        return $this->transicionarPara(StatusLivroAudio::EXTRAINDO);
    }

    public function iniciarGeracaoAudio(): self
    {
        $this->erroMotivo = null;

        return $this->transicionarPara(StatusLivroAudio::GERANDO_AUDIO);
    }

    public function marcarComoParcial(): self
    {
        return $this->transicionarPara(StatusLivroAudio::PARCIAL);
    }

    public function concluirGeracao(): self
    {
        $this->erroMotivo = null;

        return $this->transicionarPara(StatusLivroAudio::PRONTO);
    }

    public function registrarFalha(string $erroMotivo): self
    {
        $this->erroMotivo = $erroMotivo;

        return $this->transicionarPara(StatusLivroAudio::ERRO);
    }

    public function atualizarTitulo(string $titulo): self
    {
        $this->titulo = $titulo;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function definirTotalPaginas(int $totalPaginas): self
    {
        $this->totalPaginas = max(0, $totalPaginas);
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function definirCaminhoPdf(string $caminhoPdf, ?int $tamanhoBytes = null): self
    {
        $this->caminhoPdf = $caminhoPdf;
        if (null !== $tamanhoBytes) {
            $this->tamanhoBytes = $tamanhoBytes;
        }
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function isEnviado(): bool
    {
        return $this->status->isEnviado();
    }

    public function isExtraindo(): bool
    {
        return $this->status->isExtraindo();
    }

    public function isGerandoAudio(): bool
    {
        return $this->status->isGerandoAudio();
    }

    public function isParcial(): bool
    {
        return $this->status->isParcial();
    }

    public function isPronto(): bool
    {
        return $this->status->isPronto();
    }

    public function isErro(): bool
    {
        return $this->status->isErro();
    }

    public function isEmProcessamento(): bool
    {
        return $this->status->isEmProcessamento();
    }

    public function isDisponivelParaOuvir(): bool
    {
        return $this->status->isDisponivelParaOuvir();
    }

    public function isFinal(): bool
    {
        return $this->status->isFinal();
    }

    private function transicionarPara(StatusLivroAudio $status): self
    {
        $this->status = $status;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function uuidTexto(): string
    {
        return $this->uuid->toString();
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function titulo(): string
    {
        return $this->titulo;
    }

    public function caminhoPdf(): ?string
    {
        return $this->caminhoPdf;
    }

    public function tamanhoBytes(): ?int
    {
        return $this->tamanhoBytes;
    }

    public function totalPaginas(): int
    {
        return $this->totalPaginas;
    }

    public function status(): StatusLivroAudio
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
}
