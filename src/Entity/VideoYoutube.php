<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\OrigemClassificacao;
use App\Enum\StatusClassificacaoVideo;
use App\Enum\TipoVersaoMusica;
use App\Repository\VideoYoutubeRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: VideoYoutubeRepository::class)]
#[ORM\Table(name: 'video_youtube')]
#[ORM\UniqueConstraint(name: 'UNIQ_VIDEO_YOUTUBE_USUARIO_VIDEO', fields: ['usuario', 'videoId'])]
#[ORM\Index(name: 'IDX_VIDEO_YOUTUBE_USUARIO_STATUS', fields: ['usuario', 'status'])]
#[ORM\Index(name: 'IDX_VIDEO_YOUTUBE_DETALHES_ATUALIZADOS', fields: ['detalhesAtualizadosEm'])]
#[ORM\HasLifecycleCallbacks]
class VideoYoutube
{
    public const int TAMANHO_MAXIMO_DESCRICAO = 1000;
    public const string CATEGORIA_MUSICA = '10';
    private const string TIPO_FAIXA_OFICIAL = 'MUSIC_VIDEO_TYPE_ATV';
    private const string SUFIXO_CANAL_TOPIC = ' - Topic';
    private const int TAMANHO_MAXIMO_TITULO = 500;
    private const int TAMANHO_MAXIMO_CANAL = 255;
    private const int CONFIANCA_MINIMA = 0;
    private const int CONFIANCA_MAXIMA = 100;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 32)]
    private string $videoId;

    #[ORM\Column(type: 'string', length: 500)]
    private string $titulo;

    #[ORM\Column(type: 'string', length: 255)]
    private string $canal;

    #[ORM\Column(type: 'string', length: 64, nullable: true)]
    private ?string $canalId = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $duracaoMs = null;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $urlCapa = null;

    #[ORM\Column(type: 'string', length: 40, nullable: true)]
    private ?string $tipoVideo = null;

    #[ORM\Column(type: 'string', length: 64, nullable: true)]
    private ?string $categoriaYoutube = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $descricaoResumo = null;

    #[ORM\Column(type: 'boolean')]
    private bool $disponivel = true;

    #[ORM\Column(type: 'boolean')]
    private bool $aguardandoImportacao = false;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $detalhesAtualizadosEm = null;

    #[ORM\Column(type: 'string', length: 20, enumType: StatusClassificacaoVideo::class)]
    private StatusClassificacaoVideo $status;

    #[ORM\Column(type: 'string', length: 20, nullable: true, enumType: OrigemClassificacao::class)]
    private ?OrigemClassificacao $origemClassificacao = null;

    #[ORM\Column(type: 'smallint', nullable: true)]
    private ?int $confianca = null;

    /**
     * @var array<string, mixed>|null
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $respostaIa = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $classificadoEm = null;

    #[ORM\Column(type: 'string', length: 20, nullable: true, enumType: TipoVersaoMusica::class)]
    private ?TipoVersaoMusica $tipoVersao = null;

    #[ORM\ManyToOne(targetEntity: MusicaCatalogo::class)]
    #[ORM\JoinColumn(name: 'musica_catalogo_uuid', referencedColumnName: 'uuid', nullable: true, onDelete: 'SET NULL')]
    private ?MusicaCatalogo $musica = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $atualizadoEm;

    public function __construct(Usuario $usuario, string $videoId, string $titulo, string $canal)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->videoId = $videoId;
        $this->titulo = mb_substr($titulo, 0, self::TAMANHO_MAXIMO_TITULO);
        $this->canal = mb_substr($canal, 0, self::TAMANHO_MAXIMO_CANAL);
        $this->status = StatusClassificacaoVideo::Pendente;
        $this->criadoEm = new DateTimeImmutable();
        $this->atualizadoEm = new DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function atualizarDataModificacao(): void
    {
        $this->atualizadoEm = new DateTimeImmutable();
    }

    public function atualizarDadosColetados(string $titulo, string $canal, ?int $duracaoMs, ?string $urlCapa, ?string $tipoVideo = null): self
    {
        $this->aguardandoImportacao = false;
        $this->tipoVideo = $tipoVideo ?? $this->tipoVideo;
        $this->titulo = mb_substr($titulo, 0, self::TAMANHO_MAXIMO_TITULO);
        $this->canal = mb_substr($canal, 0, self::TAMANHO_MAXIMO_CANAL);
        $this->duracaoMs = $duracaoMs ?? $this->duracaoMs;
        $this->urlCapa = $urlCapa ?? $this->urlCapa;

        return $this;
    }

    public function registrarDetalhesYoutube(?string $canalId, ?string $categoriaYoutube, ?int $duracaoMs, ?string $descricao): self
    {
        $this->canalId = $canalId ?? $this->canalId;
        $this->categoriaYoutube = $categoriaYoutube;
        $this->duracaoMs = $duracaoMs ?? $this->duracaoMs;
        $this->descricaoResumo = null === $descricao ? null : mb_substr($descricao, 0, self::TAMANHO_MAXIMO_DESCRICAO);
        $this->disponivel = true;
        $this->detalhesAtualizadosEm = new DateTimeImmutable();

        return $this;
    }

    public function reservarParaImportacao(): self
    {
        $this->aguardandoImportacao = true;

        return $this;
    }

    public function liberarDaImportacao(): self
    {
        $this->aguardandoImportacao = false;

        return $this;
    }

    public function isAguardandoImportacao(): bool
    {
        return $this->aguardandoImportacao;
    }

    public function marcarIndisponivel(): self
    {
        $this->disponivel = false;
        $this->detalhesAtualizadosEm = new DateTimeImmutable();

        if (!$this->isPendente()) {
            return $this;
        }

        $this->status = StatusClassificacaoVideo::Indisponivel;
        $this->classificadoEm = new DateTimeImmutable();

        return $this;
    }

    /**
     * @param array<string, mixed>|null $respostaIa
     */
    public function classificar(
        StatusClassificacaoVideo $status,
        OrigemClassificacao $origem,
        ?int $confianca,
        ?TipoVersaoMusica $tipoVersao,
        ?MusicaCatalogo $musica,
        ?array $respostaIa = null,
    ): self {
        $this->status = $status;
        $this->origemClassificacao = $origem;
        $this->confianca = null === $confianca ? null : max(self::CONFIANCA_MINIMA, min(self::CONFIANCA_MAXIMA, $confianca));
        $this->tipoVersao = $tipoVersao;
        $this->musica = $musica;
        $this->respostaIa = $respostaIa ?? $this->respostaIa;
        $this->classificadoEm = new DateTimeImmutable();

        return $this;
    }

    public function voltarParaPendente(): self
    {
        $this->status = StatusClassificacaoVideo::Pendente;
        $this->origemClassificacao = null;
        $this->musica = null;
        $this->classificadoEm = null;

        return $this;
    }

    public function isPendente(): bool
    {
        return $this->status->isPendente();
    }

    public function isClassificadoManualmente(): bool
    {
        return null !== $this->origemClassificacao && $this->origemClassificacao->isManual();
    }

    public function isContaComoMusica(): bool
    {
        return $this->status->isContaComoMusica();
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function videoId(): string
    {
        return $this->videoId;
    }

    public function titulo(): string
    {
        return $this->titulo;
    }

    public function canal(): string
    {
        return $this->canal;
    }

    public function canalId(): ?string
    {
        return $this->canalId;
    }

    public function duracaoMs(): ?int
    {
        return $this->duracaoMs;
    }

    public function urlCapa(): ?string
    {
        return $this->urlCapa;
    }

    public function tipoVideo(): ?string
    {
        return $this->tipoVideo;
    }

    public function isFaixaOficial(): bool
    {
        return self::TIPO_FAIXA_OFICIAL === $this->tipoVideo || str_ends_with($this->canal, self::SUFIXO_CANAL_TOPIC);
    }

    public function categoriaYoutube(): ?string
    {
        return $this->categoriaYoutube;
    }

    public function descricaoResumo(): ?string
    {
        return $this->descricaoResumo;
    }

    public function disponivel(): bool
    {
        return $this->disponivel;
    }

    public function detalhesAtualizadosEm(): ?DateTimeImmutable
    {
        return $this->detalhesAtualizadosEm;
    }

    public function status(): StatusClassificacaoVideo
    {
        return $this->status;
    }

    public function origemClassificacao(): ?OrigemClassificacao
    {
        return $this->origemClassificacao;
    }

    public function confianca(): ?int
    {
        return $this->confianca;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function respostaIa(): ?array
    {
        return $this->respostaIa;
    }

    public function classificadoEm(): ?DateTimeImmutable
    {
        return $this->classificadoEm;
    }

    public function tipoVersao(): ?TipoVersaoMusica
    {
        return $this->tipoVersao;
    }

    public function musica(): ?MusicaCatalogo
    {
        return $this->musica;
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
