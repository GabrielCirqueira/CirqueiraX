<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\StatusImportacaoYoutube;
use App\Repository\ImportacaoYoutubeRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ImportacaoYoutubeRepository::class)]
#[ORM\Table(name: 'importacao_youtube')]
#[ORM\Index(name: 'IDX_IMPORTACAO_YOUTUBE_USUARIO_STATUS', fields: ['usuario', 'status'])]
class ImportacaoYoutube
{
    private const int TAMANHO_MAXIMO_NOME = 255;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 30, enumType: StatusImportacaoYoutube::class)]
    private StatusImportacaoYoutube $status;

    #[ORM\Column(type: 'string', length: 500)]
    private string $caminhoArquivo;

    #[ORM\Column(type: 'string', length: 255)]
    private string $nomeArquivoOriginal;

    #[ORM\Column(type: 'bigint')]
    private int $tamanhoBytes;

    #[ORM\Column(type: 'integer')]
    private int $totalLidos = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalDescartados = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalNovos = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalIgnorados = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalUnificados = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalVideosNovos = 0;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $erroMotivo = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $iniciadoEm = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $concluidoEm = null;

    public function __construct(Usuario $usuario, string $caminhoArquivo, string $nomeArquivoOriginal, int $tamanhoBytes, Uuid $uuid)
    {
        $this->uuid = $uuid;
        $this->usuario = $usuario;
        $this->caminhoArquivo = $caminhoArquivo;
        $this->nomeArquivoOriginal = mb_substr($nomeArquivoOriginal, 0, self::TAMANHO_MAXIMO_NOME);
        $this->tamanhoBytes = $tamanhoBytes;
        $this->status = StatusImportacaoYoutube::Enviada;
        $this->criadoEm = new DateTimeImmutable();
    }

    public function iniciarProcessamento(): self
    {
        $this->status = StatusImportacaoYoutube::Processando;
        $this->iniciadoEm = new DateTimeImmutable();

        return $this;
    }

    public function registrarLeitura(int $totalLidos, int $totalDescartados, int $totalNovos, int $totalIgnorados, int $totalUnificados, int $totalVideosNovos): self
    {
        $this->totalLidos = $totalLidos;
        $this->totalDescartados = $totalDescartados;
        $this->totalNovos = $totalNovos;
        $this->totalIgnorados = $totalIgnorados;
        $this->totalUnificados = $totalUnificados;
        $this->totalVideosNovos = $totalVideosNovos;

        return $this;
    }

    public function concluir(): self
    {
        $this->status = StatusImportacaoYoutube::Concluida;
        $this->concluidoEm = new DateTimeImmutable();

        return $this;
    }

    public function falhar(string $erroMotivo): self
    {
        $this->status = StatusImportacaoYoutube::Erro;
        $this->erroMotivo = $erroMotivo;
        $this->concluidoEm = new DateTimeImmutable();

        return $this;
    }

    public function isFinalizada(): bool
    {
        return $this->status->isFinalizado();
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function status(): StatusImportacaoYoutube
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

    public function totalDescartados(): int
    {
        return $this->totalDescartados;
    }

    public function totalNovos(): int
    {
        return $this->totalNovos;
    }

    public function totalIgnorados(): int
    {
        return $this->totalIgnorados;
    }

    public function totalUnificados(): int
    {
        return $this->totalUnificados;
    }

    public function totalVideosNovos(): int
    {
        return $this->totalVideosNovos;
    }

    public function erroMotivo(): ?string
    {
        return $this->erroMotivo;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function iniciadoEm(): ?DateTimeImmutable
    {
        return $this->iniciadoEm;
    }

    public function concluidoEm(): ?DateTimeImmutable
    {
        return $this->concluidoEm;
    }
}
