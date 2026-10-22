<?php

declare(strict_types=1);

namespace App\Entity;

use App\DataObject\AudioBaixadoDTO;
use App\Enum\StatusAudio;
use App\Repository\AudioRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: AudioRepository::class)]
#[ORM\Table(name: 'audio')]
#[ORM\Index(name: 'IDX_AUDIO_USUARIO_CRIADO_EM', fields: ['usuario', 'criadoEm'])]
#[ORM\Index(name: 'IDX_AUDIO_STATUS_BAIXADO_EM', fields: ['status', 'baixadoEm'])]
class Audio
{
    public const int DIAS_RETENCAO_ARQUIVO = 7;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 1024)]
    private string $url;

    #[ORM\Column(type: 'string', enumType: StatusAudio::class)]
    private StatusAudio $status;

    #[ORM\Column(type: 'string', length: 512, nullable: true)]
    private ?string $titulo = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $autor = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $duracaoSegundos = null;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $thumbnailUrl = null;

    #[ORM\Column(type: 'string', length: 512, nullable: true)]
    private ?string $caminhoArquivo = null;

    #[ORM\Column(type: 'bigint', nullable: true)]
    private ?int $tamanhoBytes = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $erroMotivo = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $atualizadoEm;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $baixadoEm = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $expiradoEm = null;

    public function __construct(Usuario $usuario, string $url)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->url = $url;
        $this->status = StatusAudio::PENDENTE;
        $this->criadoEm = new DateTimeImmutable();
        $this->atualizadoEm = $this->criadoEm;
    }

    public function iniciarDownload(): self
    {
        $this->erroMotivo = null;

        return $this->transicionarPara(StatusAudio::BAIXANDO);
    }

    public function concluirDownload(AudioBaixadoDTO $audioBaixado): self
    {
        $this->caminhoArquivo = $audioBaixado->caminhoArquivo();
        $this->tamanhoBytes = $audioBaixado->tamanhoBytes();
        $this->titulo = $audioBaixado->titulo() ?? $this->titulo;
        $this->autor = $audioBaixado->autor() ?? $this->autor;
        $this->duracaoSegundos = $audioBaixado->duracaoSegundos() ?? $this->duracaoSegundos;
        $this->thumbnailUrl = $audioBaixado->thumbnailUrl() ?? $this->thumbnailUrl;
        $this->baixadoEm = new DateTimeImmutable();
        $this->expiradoEm = null;

        return $this->transicionarPara(StatusAudio::DISPONIVEL);
    }

    public function registrarFalha(string $erroMotivo): self
    {
        $this->erroMotivo = $erroMotivo;

        return $this->transicionarPara(StatusAudio::ERRO);
    }

    public function expirar(): self
    {
        $this->caminhoArquivo = null;
        $this->expiradoEm = new DateTimeImmutable();

        return $this->transicionarPara(StatusAudio::EXPIRADO);
    }

    public function prepararParaRebaixar(): self
    {
        $this->erroMotivo = null;

        return $this->transicionarPara(StatusAudio::PENDENTE);
    }

    public function expiraEm(): ?DateTimeImmutable
    {
        if (!$this->isDisponivel() || null === $this->baixadoEm) {
            return null;
        }

        return $this->baixadoEm->modify(sprintf('+%d days', self::DIAS_RETENCAO_ARQUIVO));
    }

    public function isAguardandoDownload(): bool
    {
        return $this->status->isPendente();
    }

    public function isEmProcessamento(): bool
    {
        return $this->status->isEmProcessamento();
    }

    public function isDisponivel(): bool
    {
        return $this->status->isDisponivel() && null !== $this->caminhoArquivo;
    }

    public function isRebaixavel(): bool
    {
        return $this->status->isRebaixavel();
    }

    private function transicionarPara(StatusAudio $status): self
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

    public function url(): string
    {
        return $this->url;
    }

    public function status(): StatusAudio
    {
        return $this->status;
    }

    public function titulo(): ?string
    {
        return $this->titulo;
    }

    public function autor(): ?string
    {
        return $this->autor;
    }

    public function duracaoSegundos(): ?int
    {
        return $this->duracaoSegundos;
    }

    public function thumbnailUrl(): ?string
    {
        return $this->thumbnailUrl;
    }

    public function caminhoArquivo(): ?string
    {
        return $this->caminhoArquivo;
    }

    public function tamanhoBytes(): ?int
    {
        return $this->tamanhoBytes;
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

    public function baixadoEm(): ?DateTimeImmutable
    {
        return $this->baixadoEm;
    }

    public function expiradoEm(): ?DateTimeImmutable
    {
        return $this->expiradoEm;
    }
}
