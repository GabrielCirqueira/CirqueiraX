<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\OrigemEnvioGoogleFotos;
use App\Enum\OrigemMedia;
use App\Enum\StatusEnvioGoogleFotos;
use App\Repository\RegistroEnvioGoogleFotosRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: RegistroEnvioGoogleFotosRepository::class)]
#[ORM\Table(name: 'registro_envio_google_fotos')]
#[ORM\Index(name: 'IDX_REGISTRO_ENVIO_MEDIA_ITEM', fields: ['mediaItemUuid'])]
#[ORM\Index(name: 'IDX_REGISTRO_ENVIO_INICIADO_EM', fields: ['iniciadoEm'])]
#[ORM\Index(name: 'IDX_REGISTRO_ENVIO_STATUS', fields: ['status'])]
class RegistroEnvioGoogleFotos
{
    private const int MILISSEGUNDOS_POR_SEGUNDO = 1000;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\Column(type: 'string', length: 36)]
    private string $mediaItemUuid;

    #[ORM\Column(type: 'string', enumType: OrigemMedia::class)]
    private OrigemMedia $origemMidia;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $nomeArquivo = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $tipoArquivo = null;

    #[ORM\Column(type: 'bigint', nullable: true)]
    private ?int $tamanhoBytes = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $dataMidia;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $categoriaNome = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $albumId = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $contaEmail = null;

    #[ORM\Column(type: 'string', enumType: StatusEnvioGoogleFotos::class)]
    private StatusEnvioGoogleFotos $status;

    #[ORM\Column(type: 'string', enumType: OrigemEnvioGoogleFotos::class)]
    private OrigemEnvioGoogleFotos $origemEnvio;

    #[ORM\Column(type: 'integer')]
    private int $tentativa;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $googlePhotosMediaId = null;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $googlePhotosUrl = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $erroMotivo = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $iniciadoEm;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $finalizadoEm = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $duracaoMs = null;

    public function __construct(
        MediaItem $mediaItem,
        OrigemEnvioGoogleFotos $origemEnvio,
        int $tentativa,
    ) {
        $this->uuid = Uuid::v7();
        $this->mediaItemUuid = $mediaItem->uuidTexto();
        $this->origemMidia = $mediaItem->origem();
        $this->dataMidia = $mediaItem->dataExibicao();
        $this->origemEnvio = $origemEnvio;
        $this->tentativa = $tentativa;
        $this->status = StatusEnvioGoogleFotos::ENVIANDO;
        $this->iniciadoEm = new DateTimeImmutable();
    }

    public function descreverArquivo(string $nomeArquivo, string $tipoArquivo, ?int $tamanhoBytes): self
    {
        $this->nomeArquivo = $nomeArquivo;
        $this->tipoArquivo = $tipoArquivo;
        $this->tamanhoBytes = $tamanhoBytes;

        return $this;
    }

    public function vincularDestino(?string $contaEmail, string $categoriaNome, ?string $albumId): self
    {
        $this->contaEmail = $contaEmail;
        $this->categoriaNome = $categoriaNome;
        $this->albumId = $albumId;

        return $this;
    }

    public function marcarEnviado(string $googlePhotosMediaId, ?string $googlePhotosUrl): self
    {
        $this->googlePhotosMediaId = $googlePhotosMediaId;
        $this->googlePhotosUrl = $googlePhotosUrl;
        $this->finalizarCom(StatusEnvioGoogleFotos::ENVIADO);

        return $this;
    }

    public function marcarReaproveitado(string $googlePhotosMediaId): self
    {
        $this->googlePhotosMediaId = $googlePhotosMediaId;
        $this->finalizarCom(StatusEnvioGoogleFotos::REAPROVEITADO);

        return $this;
    }

    public function registrarFalha(string $erroMotivo): self
    {
        $this->erroMotivo = $erroMotivo;
        $this->finalizarCom(StatusEnvioGoogleFotos::FALHA);

        return $this;
    }

    public function isFalha(): bool
    {
        return $this->status->isFalha();
    }

    private function finalizarCom(StatusEnvioGoogleFotos $status): void
    {
        $this->status = $status;
        $this->finalizadoEm = new DateTimeImmutable();
        $this->duracaoMs = (int) round(
            ((float) $this->finalizadoEm->format('U.u') - (float) $this->iniciadoEm->format('U.u')) * self::MILISSEGUNDOS_POR_SEGUNDO
        );
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function mediaItemUuid(): string
    {
        return $this->mediaItemUuid;
    }

    public function origemMidia(): OrigemMedia
    {
        return $this->origemMidia;
    }

    public function nomeArquivo(): ?string
    {
        return $this->nomeArquivo;
    }

    public function tipoArquivo(): ?string
    {
        return $this->tipoArquivo;
    }

    public function tamanhoBytes(): ?int
    {
        return $this->tamanhoBytes;
    }

    public function dataMidia(): DateTimeImmutable
    {
        return $this->dataMidia;
    }

    public function categoriaNome(): ?string
    {
        return $this->categoriaNome;
    }

    public function albumId(): ?string
    {
        return $this->albumId;
    }

    public function contaEmail(): ?string
    {
        return $this->contaEmail;
    }

    public function status(): StatusEnvioGoogleFotos
    {
        return $this->status;
    }

    public function origemEnvio(): OrigemEnvioGoogleFotos
    {
        return $this->origemEnvio;
    }

    public function tentativa(): int
    {
        return $this->tentativa;
    }

    public function googlePhotosMediaId(): ?string
    {
        return $this->googlePhotosMediaId;
    }

    public function googlePhotosUrl(): ?string
    {
        return $this->googlePhotosUrl;
    }

    public function erroMotivo(): ?string
    {
        return $this->erroMotivo;
    }

    public function iniciadoEm(): DateTimeImmutable
    {
        return $this->iniciadoEm;
    }

    public function finalizadoEm(): ?DateTimeImmutable
    {
        return $this->finalizadoEm;
    }

    public function duracaoMs(): ?int
    {
        return $this->duracaoMs;
    }
}
