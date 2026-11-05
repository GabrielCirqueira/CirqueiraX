<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\StatusImagemSpotify;
use App\Enum\TipoImagemSpotify;
use App\Repository\ImagemSpotifyRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ImagemSpotifyRepository::class)]
#[ORM\Table(name: 'imagem_spotify')]
#[ORM\UniqueConstraint(name: 'UNIQ_IMAGEM_SPOTIFY_CHAVE_BUSCA', fields: ['chaveBusca'])]
#[ORM\Index(name: 'IDX_IMAGEM_SPOTIFY_CODIGO', fields: ['codigoSpotify'])]
#[ORM\Index(name: 'IDX_IMAGEM_SPOTIFY_TIPO_STATUS', fields: ['tipo', 'status'])]
class ImagemSpotify
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\Column(type: 'string', length: 20, enumType: TipoImagemSpotify::class)]
    private TipoImagemSpotify $tipo;

    #[ORM\Column(type: 'string', length: 20, enumType: StatusImagemSpotify::class)]
    private StatusImagemSpotify $status;

    #[ORM\Column(type: 'string', length: 255)]
    private string $chaveBusca;

    #[ORM\Column(type: 'string', length: 64, nullable: true)]
    private ?string $codigoSpotify = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $nome;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $artista = null;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $imagemGrandeUrl = null;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $imagemMediaUrl = null;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $imagemPequenaUrl = null;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $urlSpotify = null;

    #[ORM\Column(type: 'string', length: 16, nullable: true)]
    private ?string $corDominante = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $duracaoMs = null;

    #[ORM\Column(type: 'integer')]
    private int $tentativas = 0;

    #[ORM\Column(type: 'string', length: 500, nullable: true)]
    private ?string $motivoFalha = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $buscadaEm = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $atualizadoEm;

    public function __construct()
    {
        $this->uuid = Uuid::v7();
        $this->status = StatusImagemSpotify::Pendente;
        $this->criadoEm = new DateTimeImmutable();
        $this->atualizadoEm = new DateTimeImmutable();
    }

    public static function criarParaFaixa(
        string $nome,
        string $artista,
        ?string $codigoFaixa = null,
        ?int $duracaoMs = null,
    ): self {
        $instancia = new self();
        $instancia->tipo = TipoImagemSpotify::Faixa;
        $instancia->nome = $nome;
        $instancia->artista = $artista;
        $instancia->codigoSpotify = $codigoFaixa !== null && '' !== trim($codigoFaixa) ? trim($codigoFaixa) : null;
        $instancia->duracaoMs = $duracaoMs;
        $instancia->chaveBusca = self::gerarChaveFaixa($instancia->codigoSpotify, $artista, $nome);
        $instancia->urlSpotify = self::gerarUrlSpotifyFaixa($instancia->codigoSpotify, $artista, $nome);

        return $instancia;
    }

    public static function criarParaArtista(
        string $nomeArtista,
        ?string $codigoArtista = null,
    ): self {
        $instancia = new self();
        $instancia->tipo = TipoImagemSpotify::Artista;
        $instancia->nome = $nomeArtista;
        $instancia->artista = null;
        $instancia->codigoSpotify = $codigoArtista !== null && '' !== trim($codigoArtista)
            ? trim($codigoArtista)
            : null;
        $instancia->chaveBusca = self::gerarChaveArtista($instancia->codigoSpotify, $nomeArtista);
        $instancia->urlSpotify = self::gerarUrlSpotifyArtista($instancia->codigoSpotify, $nomeArtista);

        return $instancia;
    }

    public static function gerarChaveFaixa(?string $codigoFaixa, string $artista, string $nome): string
    {
        if ($codigoFaixa !== null && '' !== trim($codigoFaixa)) {
            return 'faixa:codigo:' . trim($codigoFaixa);
        }

        return 'faixa:nome:' . mb_strtolower(trim($artista)) . '|' . mb_strtolower(trim($nome));
    }

    public static function gerarChaveArtista(?string $codigoArtista, string $nomeArtista): string
    {
        if ($codigoArtista !== null && '' !== trim($codigoArtista)) {
            return 'artista:codigo:' . trim($codigoArtista);
        }

        return 'artista:nome:' . mb_strtolower(trim($nomeArtista));
    }

    public static function gerarUrlSpotifyFaixa(?string $codigoFaixa, string $artista, string $nome): string
    {
        if ($codigoFaixa !== null && '' !== trim($codigoFaixa)) {
            return 'https://open.spotify.com/track/' . trim($codigoFaixa);
        }

        return 'https://open.spotify.com/search/' . rawurlencode(trim($artista) . ' ' . trim($nome));
    }

    public static function gerarUrlSpotifyArtista(?string $codigoArtista, string $nomeArtista): string
    {
        if ($codigoArtista !== null && '' !== trim($codigoArtista)) {
            return 'https://open.spotify.com/artist/' . trim($codigoArtista);
        }

        return 'https://open.spotify.com/search/' . rawurlencode(trim($nomeArtista));
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function id(): string
    {
        return $this->uuid->toRfc4122();
    }

    public function tipo(): TipoImagemSpotify
    {
        return $this->tipo;
    }

    public function status(): StatusImagemSpotify
    {
        return $this->status;
    }

    public function chaveBusca(): string
    {
        return $this->chaveBusca;
    }

    public function codigoSpotify(): ?string
    {
        return $this->codigoSpotify;
    }

    public function nome(): string
    {
        return $this->nome;
    }

    public function artista(): ?string
    {
        return $this->artista;
    }

    public function imagemGrandeUrl(): ?string
    {
        return $this->imagemGrandeUrl;
    }

    public function imagemMediaUrl(): ?string
    {
        return $this->imagemMediaUrl;
    }

    public function imagemPequenaUrl(): ?string
    {
        return $this->imagemPequenaUrl;
    }

    public function primeiraImagemUrl(): ?string
    {
        return $this->imagemMediaUrl ?? $this->imagemGrandeUrl ?? $this->imagemPequenaUrl;
    }

    public function urlSpotify(): ?string
    {
        return $this->urlSpotify;
    }

    public function corDominante(): ?string
    {
        return $this->corDominante;
    }

    public function duracaoMs(): ?int
    {
        return $this->duracaoMs;
    }

    public function tentativas(): int
    {
        return $this->tentativas;
    }

    public function motivoFalha(): ?string
    {
        return $this->motivoFalha;
    }

    public function buscadaEm(): ?DateTimeImmutable
    {
        return $this->buscadaEm;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function atualizadoEm(): DateTimeImmutable
    {
        return $this->atualizadoEm;
    }

    public function isPendente(): bool
    {
        return $this->status->isPendente();
    }

    public function isEncontrada(): bool
    {
        return $this->status->isEncontrada();
    }

    public function isNaoEncontrada(): bool
    {
        return $this->status->isNaoEncontrada();
    }

    public function isFinalizado(): bool
    {
        return $this->status->isFinalizado();
    }

    public function marcarEncontrada(
        ?string $codigoSpotify,
        ?string $grandeUrl,
        ?string $mediaUrl,
        ?string $pequenaUrl,
        ?string $urlSpotify = null,
        ?string $corDominante = null,
    ): self {
        $this->status = StatusImagemSpotify::Encontrada;
        if ($codigoSpotify !== null && '' !== trim($codigoSpotify)) {
            $this->codigoSpotify = trim($codigoSpotify);
        }
        $this->imagemGrandeUrl = $grandeUrl;
        $this->imagemMediaUrl = $mediaUrl;
        $this->imagemPequenaUrl = $pequenaUrl;

        if ($urlSpotify !== null && '' !== trim($urlSpotify)) {
            $this->urlSpotify = trim($urlSpotify);
        } elseif ($this->codigoSpotify !== null) {
            $this->urlSpotify = $this->tipo->isFaixa()
                ? 'https://open.spotify.com/track/' . $this->codigoSpotify
                : 'https://open.spotify.com/artist/' . $this->codigoSpotify;
        }

        if ($corDominante !== null && '' !== trim($corDominante)) {
            $this->corDominante = trim($corDominante);
        }

        $this->motivoFalha = null;
        $this->buscadaEm = new DateTimeImmutable();
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function marcarNaoEncontrada(?string $motivo = null): self
    {
        $this->status = StatusImagemSpotify::NaoEncontrada;
        $this->motivoFalha = $motivo;
        $this->buscadaEm = new DateTimeImmutable();
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function incrementarTentativas(): self
    {
        ++$this->tentativas;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function setCodigoSpotify(?string $codigo): self
    {
        if ($codigo !== null && '' !== trim($codigo)) {
            $this->codigoSpotify = trim($codigo);
            if ($this->tipo->isFaixa()) {
                $this->urlSpotify = 'https://open.spotify.com/track/' . $this->codigoSpotify;
            } else {
                $this->urlSpotify = 'https://open.spotify.com/artist/' . $this->codigoSpotify;
            }
        }

        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }
}
