<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\FonteReproducaoSpotify;
use App\Repository\ReproducaoSpotifyRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ReproducaoSpotifyRepository::class)]
#[ORM\Table(name: 'reproducao_spotify')]
#[ORM\UniqueConstraint(name: 'UNIQ_REPRODUCAO_SPOTIFY_USUARIO_CHAVE', fields: ['usuario', 'chaveDeduplicacao'])]
#[ORM\Index(name: 'IDX_REPRODUCAO_SPOTIFY_USUARIO_TOCADA_EM', fields: ['usuario', 'tocadaEm'])]
#[ORM\Index(name: 'IDX_REPRODUCAO_SPOTIFY_USUARIO_ARTISTA', fields: ['usuario', 'artistaPrincipal'])]
#[ORM\Index(name: 'IDX_REPRODUCAO_SPOTIFY_USUARIO_FAIXA', fields: ['usuario', 'nomeFaixa'])]
#[ORM\Index(name: 'IDX_REPRODUCAO_SPOTIFY_FONTE', fields: ['fonte'])]
class ReproducaoSpotify
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $codigoFaixa = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $nomeFaixa;

    #[ORM\Column(type: 'string', length: 255)]
    private string $artistaPrincipal;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $codigoArtistaPrincipal = null;

    /**
     * @var array<int, string>|null
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $demaisArtistas = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $album;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $duracaoMs = null;

    #[ORM\Column(type: 'integer')]
    private int $msReproduzidos;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $tocadaEm;

    #[ORM\Column(type: 'string', length: 30, enumType: FonteReproducaoSpotify::class)]
    private FonteReproducaoSpotify $fonte;

    #[ORM\Column(type: 'string', length: 255)]
    private string $chaveDeduplicacao;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $pulada = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $aleatorio = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadoEm;

    /**
     * @param array<int, string>|null $demaisArtistas
     */
    public function __construct(
        Usuario $usuario,
        ?string $codigoFaixa,
        string $nomeFaixa,
        string $artistaPrincipal,
        ?string $codigoArtistaPrincipal,
        ?array $demaisArtistas,
        string $album,
        ?int $duracaoMs,
        int $msReproduzidos,
        \DateTimeImmutable $tocadaEm,
        FonteReproducaoSpotify $fonte,
    ) {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->codigoFaixa = $codigoFaixa;
        $this->nomeFaixa = $nomeFaixa;
        $this->artistaPrincipal = $artistaPrincipal;
        $this->codigoArtistaPrincipal = $codigoArtistaPrincipal;
        $this->demaisArtistas = $demaisArtistas;
        $this->album = $album;
        $this->duracaoMs = $duracaoMs;
        $this->msReproduzidos = $msReproduzidos;
        $this->tocadaEm = $tocadaEm;
        $this->fonte = $fonte;
        $this->chaveDeduplicacao = self::gerarChaveDeduplicacao($codigoFaixa, $nomeFaixa, $artistaPrincipal, $tocadaEm);
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

    public function codigoFaixa(): ?string
    {
        return $this->codigoFaixa;
    }

    public function nomeFaixa(): string
    {
        return $this->nomeFaixa;
    }

    public function artistaPrincipal(): string
    {
        return $this->artistaPrincipal;
    }

    public function codigoArtistaPrincipal(): ?string
    {
        return $this->codigoArtistaPrincipal;
    }

    /**
     * @return array<int, string>|null
     */
    public function demaisArtistas(): ?array
    {
        return $this->demaisArtistas;
    }

    public function album(): string
    {
        return $this->album;
    }

    public function duracaoMs(): ?int
    {
        return $this->duracaoMs;
    }

    public function msReproduzidos(): int
    {
        return $this->msReproduzidos;
    }

    public function tocadaEm(): \DateTimeImmutable
    {
        return $this->tocadaEm;
    }

    public function fonte(): FonteReproducaoSpotify
    {
        return $this->fonte;
    }

    public function chaveDeduplicacao(): string
    {
        return $this->chaveDeduplicacao;
    }

    public function criadoEm(): \DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function pulada(): ?bool
    {
        return $this->pulada;
    }

    public function aleatorio(): ?bool
    {
        return $this->aleatorio;
    }

    public function registrarComportamento(?bool $pulada, ?bool $aleatorio): self
    {
        if (null !== $pulada) {
            $this->pulada = $pulada;
        }

        if (null !== $aleatorio) {
            $this->aleatorio = $aleatorio;
        }

        return $this;
    }

    public function podeSerSubstituidaPor(FonteReproducaoSpotify $novaFonte): bool
    {
        return $this->fonte->prioridade() < $novaFonte->prioridade();
    }

    public function atualizarDeImportacao(
        int $msReproduzidos,
        FonteReproducaoSpotify $novaFonte,
        ?string $codigoFaixa = null,
        ?string $album = null,
    ): self {
        $this->msReproduzidos = $msReproduzidos;
        $this->fonte = $novaFonte;

        if (null !== $codigoFaixa && '' !== trim($codigoFaixa) && null === $this->codigoFaixa) {
            $this->codigoFaixa = trim($codigoFaixa);
        }

        if (null !== $album && '' !== trim($album)) {
            $this->album = trim($album);
        }

        return $this;
    }

    public function isMesmaFaixa(?string $codigoFaixa, string $nomeFaixa, string $artistaPrincipal): bool
    {
        if (null !== $this->codigoFaixa && null !== $codigoFaixa && '' !== trim($codigoFaixa)) {
            return trim($this->codigoFaixa) === trim($codigoFaixa);
        }

        $faixaNormalizada = self::normalizarTexto($nomeFaixa);
        $artistaNormalizado = self::normalizarTexto($artistaPrincipal);

        return self::normalizarTexto($this->nomeFaixa) === $faixaNormalizada
            && self::normalizarTexto($this->artistaPrincipal) === $artistaNormalizado;
    }

    public static function gerarChaveDeduplicacao(
        ?string $codigoFaixa,
        string $nomeFaixa,
        string $artistaPrincipal,
        \DateTimeImmutable $tocadaEm,
    ): string {
        $timestamp = $tocadaEm->getTimestamp();

        if (null !== $codigoFaixa && '' !== trim($codigoFaixa)) {
            return sprintf('track_%s_%d', trim($codigoFaixa), $timestamp);
        }

        $faixaNormalizada = self::normalizarTexto($nomeFaixa);
        $artistaNormalizado = self::normalizarTexto($artistaPrincipal);

        $assinatura = sprintf('%s|%s|%d', $faixaNormalizada, $artistaNormalizado, $timestamp);

        return hash('sha256', $assinatura);
    }

    private static function normalizarTexto(string $texto): string
    {
        $limpo = mb_strtolower(trim($texto), 'UTF-8');
        $semAcentos = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $limpo);
        if (false !== $semAcentos) {
            $limpo = $semAcentos;
        }
        $limpo = preg_replace('/\s+/', ' ', $limpo) ?? $limpo;

        return trim($limpo);
    }
}
