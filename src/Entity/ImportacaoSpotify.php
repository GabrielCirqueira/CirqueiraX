<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\StatusImportacaoSpotify;
use App\Repository\ImportacaoSpotifyRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ImportacaoSpotifyRepository::class)]
#[ORM\Table(name: 'importacao_spotify')]
#[ORM\Index(name: 'IDX_IMPORTACAO_SPOTIFY_USUARIO_STATUS', fields: ['usuario', 'status'])]
#[ORM\Index(name: 'IDX_IMPORTACAO_SPOTIFY_CRIADO_EM', fields: ['criadoEm'])]
class ImportacaoSpotify
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 30, enumType: StatusImportacaoSpotify::class)]
    private StatusImportacaoSpotify $status;

    #[ORM\Column(type: 'string', length: 500)]
    private string $caminhoArquivo;

    #[ORM\Column(type: 'string', length: 255)]
    private string $nomeArquivoOriginal;

    #[ORM\Column(type: 'bigint')]
    private int $tamanhoBytes;

    #[ORM\Column(type: 'integer')]
    private int $totalLidos = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalNovos = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalIgnorados = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalSubstituidos = 0;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $erroMotivo = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $iniciadoEm = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $concluidoEm = null;

    public function __construct(
        Usuario $usuario,
        string $caminhoArquivo,
        string $nomeArquivoOriginal,
        int $tamanhoBytes,
        ?Uuid $uuid = null,
    ) {
        $this->uuid = $uuid ?? Uuid::v7();
        $this->usuario = $usuario;
        $this->caminhoArquivo = $caminhoArquivo;
        $this->nomeArquivoOriginal = $nomeArquivoOriginal;
        $this->tamanhoBytes = $tamanhoBytes;
        $this->status = StatusImportacaoSpotify::Enviada;
        $this->criadoEm = new \DateTimeImmutable();
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function status(): StatusImportacaoSpotify
    {
        return $this->status;
    }

    public function caminhoArquivo(): string
    {
        return $this->caminhoArquivo;
    }

    public function nomeArquivoOriginal(): string
    {
        return $this->nomeArquivoOriginal;
    }

    public function tamanhoBytes(): int
    {
        return $this->tamanhoBytes;
    }

    public function totalLidos(): int
    {
        return $this->totalLidos;
    }

    public function totalNovos(): int
    {
        return $this->totalNovos;
    }

    public function totalIgnorados(): int
    {
        return $this->totalIgnorados;
    }

    public function totalSubstituidos(): int
    {
        return $this->totalSubstituidos;
    }

    public function erroMotivo(): ?string
    {
        return $this->erroMotivo;
    }

    public function criadoEm(): \DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function iniciadoEm(): ?\DateTimeImmutable
    {
        return $this->iniciadoEm;
    }

    public function concluidoEm(): ?\DateTimeImmutable
    {
        return $this->concluidoEm;
    }

    public function isEmAndamento(): bool
    {
        return $this->status->isEnviada() || $this->status->isProcessando();
    }

    public function isFinalizada(): bool
    {
        return $this->status->isFinalizado();
    }

    public function iniciarProcessamento(): self
    {
        $this->status = StatusImportacaoSpotify::Processando;
        $this->iniciadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function concluir(int $totalLidos, int $totalNovos, int $totalIgnorados, int $totalSubstituidos): self
    {
        $this->status = StatusImportacaoSpotify::Concluida;
        $this->totalLidos = $totalLidos;
        $this->totalNovos = $totalNovos;
        $this->totalIgnorados = $totalIgnorados;
        $this->totalSubstituidos = $totalSubstituidos;
        $this->concluidoEm = new \DateTimeImmutable();

        return $this;
    }

    public function falhar(string $erroMotivo): self
    {
        $this->status = StatusImportacaoSpotify::Erro;
        $this->erroMotivo = $erroMotivo;
        $this->concluidoEm = new \DateTimeImmutable();

        return $this;
    }
}
