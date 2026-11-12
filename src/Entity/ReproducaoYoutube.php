<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\FonteReproducaoYoutube;
use App\Repository\ReproducaoYoutubeRepository;
use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ReproducaoYoutubeRepository::class)]
#[ORM\Table(name: 'reproducao_youtube')]
#[ORM\UniqueConstraint(name: 'UNIQ_REPRODUCAO_YOUTUBE_USUARIO_CHAVE', fields: ['usuario', 'chaveDeduplicacao'])]
#[ORM\UniqueConstraint(name: 'UNIQ_REPRODUCAO_YOUTUBE_USUARIO_EXTENSAO', fields: ['usuario', 'idExtensao'])]
#[ORM\Index(name: 'IDX_REPRODUCAO_YOUTUBE_USUARIO_TOCADA', fields: ['usuario', 'tocadaEm'])]
class ReproducaoYoutube
{
    private const string ALGORITMO_CHAVE = 'sha256';
    private const string FORMATO_CHAVE = 'Y-m-d H:i:s';
    private const string FUSO_UTC = 'UTC';
    private const string FORMATO_DATA_HORA = 'Y-m-d H:i:s';
    private const string SEPARADOR_CHAVE = '|';
    private const string PREFIXO_CHAVE_EXTENSAO = 'extensao';
    private const float FRACAO_OUVIDA_COMPLETA = 0.9;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\ManyToOne(targetEntity: VideoYoutube::class)]
    #[ORM\JoinColumn(name: 'video_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private VideoYoutube $video;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $tocadaEm;

    #[ORM\Column(type: 'integer')]
    private int $msReproduzidos;

    #[ORM\Column(type: 'boolean')]
    private bool $tempoExato = false;

    #[ORM\Column(type: 'string', length: 20, enumType: FonteReproducaoYoutube::class)]
    private FonteReproducaoYoutube $fonte;

    #[ORM\Column(type: 'string', length: 64)]
    private string $chaveDeduplicacao;

    #[ORM\Column(type: 'string', length: 64, nullable: true)]
    private ?string $idExtensao = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $pulada = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $vistaPeloColetor = false;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $extensaoAtualizadaEm = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    public function __construct(Usuario $usuario, VideoYoutube $video, DateTimeImmutable $tocadaEm, int $msReproduzidos, FonteReproducaoYoutube $fonte)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->video = $video;
        $this->tocadaEm = $tocadaEm->setTimezone(new DateTimeZone(self::FUSO_UTC));
        $this->msReproduzidos = max(0, $msReproduzidos);
        $this->fonte = $fonte;
        $this->chaveDeduplicacao = self::gerarChaveDeduplicacao($video->videoId(), $this->tocadaEm);
        $this->criadoEm = new DateTimeImmutable();
    }

    public static function gerarChaveDeduplicacao(string $videoId, DateTimeInterface $tocadaEm): string
    {
        $momentoUtc = DateTimeImmutable::createFromInterface($tocadaEm)->setTimezone(new DateTimeZone(self::FUSO_UTC));

        return hash(self::ALGORITMO_CHAVE, $videoId.self::SEPARADOR_CHAVE.$momentoUtc->format(self::FORMATO_CHAVE));
    }

    public static function gerarChaveExtensao(string $idExtensao): string
    {
        return hash(self::ALGORITMO_CHAVE, self::PREFIXO_CHAVE_EXTENSAO.self::SEPARADOR_CHAVE.$idExtensao);
    }

    public function assumirDadosDaExtensao(string $idExtensao, DateTimeImmutable $inicio, int $msOuvidos, ?bool $pulada): self
    {
        $this->idExtensao = $idExtensao;
        $this->tocadaEm = $inicio->setTimezone(new DateTimeZone(self::FUSO_UTC));
        $this->fonte = FonteReproducaoYoutube::Extensao;
        $this->tempoExato = true;
        $this->msReproduzidos = max(0, $msOuvidos);
        $this->pulada = $pulada;
        $this->chaveDeduplicacao = self::gerarChaveExtensao($idExtensao);
        $this->extensaoAtualizadaEm = new DateTimeImmutable();

        return $this;
    }

    public function atualizarProgressoDaExtensao(int $msOuvidos, ?bool $pulada): self
    {
        $this->msReproduzidos = max($this->msReproduzidos, $msOuvidos);
        $this->pulada = $pulada ?? $this->pulada;
        $this->extensaoAtualizadaEm = new DateTimeImmutable();

        return $this;
    }

    public function encerrarSemFimDaExtensao(): self
    {
        $duracaoMs = $this->video->duracaoMs();
        if (null !== $this->pulada || null === $duracaoMs || $duracaoMs <= 0) {
            return $this;
        }

        $this->pulada = $this->msReproduzidos < $duracaoMs * self::FRACAO_OUVIDA_COMPLETA;

        return $this;
    }

    public function marcarVistaPeloColetor(): self
    {
        $this->vistaPeloColetor = true;

        return $this;
    }

    public function isDaExtensao(): bool
    {
        return $this->fonte->isExtensao();
    }

    public function isTempoExato(): bool
    {
        return $this->tempoExato;
    }

    public function isVistaPeloColetor(): bool
    {
        return $this->vistaPeloColetor;
    }

    public function isEncerradaPelaExtensao(): bool
    {
        return null !== $this->pulada;
    }

    public function unificarComTakeout(DateTimeImmutable $tocadaEm): self
    {
        $this->tocadaEm = $tocadaEm->setTimezone(new DateTimeZone(self::FUSO_UTC));
        $this->fonte = FonteReproducaoYoutube::Takeout;
        $this->chaveDeduplicacao = self::gerarChaveDeduplicacao($this->video->videoId(), $this->tocadaEm);

        return $this;
    }

    public function ajustarMsReproduzidos(int $msReproduzidos): self
    {
        $this->msReproduzidos = max(0, $msReproduzidos);

        return $this;
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function video(): VideoYoutube
    {
        return $this->video;
    }

    public function tocadaEm(): DateTimeImmutable
    {
        return new DateTimeImmutable($this->tocadaEm->format(self::FORMATO_DATA_HORA), new DateTimeZone(self::FUSO_UTC));
    }

    public function msReproduzidos(): int
    {
        return $this->msReproduzidos;
    }

    public function tempoExato(): bool
    {
        return $this->tempoExato;
    }

    public function fonte(): FonteReproducaoYoutube
    {
        return $this->fonte;
    }

    public function chaveDeduplicacao(): string
    {
        return $this->chaveDeduplicacao;
    }

    public function idExtensao(): ?string
    {
        return $this->idExtensao;
    }

    public function pulada(): ?bool
    {
        return $this->pulada;
    }

    public function extensaoAtualizadaEm(): ?DateTimeImmutable
    {
        return $this->extensaoAtualizadaEm;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }
}
