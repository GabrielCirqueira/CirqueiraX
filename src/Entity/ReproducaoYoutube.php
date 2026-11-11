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
#[ORM\Index(name: 'IDX_REPRODUCAO_YOUTUBE_USUARIO_TOCADA', fields: ['usuario', 'tocadaEm'])]
class ReproducaoYoutube
{
    private const string ALGORITMO_CHAVE = 'sha256';
    private const string FORMATO_CHAVE = 'Y-m-d H:i:s';
    private const string FUSO_UTC = 'UTC';
    private const string SEPARADOR_CHAVE = '|';

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
        return $this->tocadaEm;
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

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }
}
