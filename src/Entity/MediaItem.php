<?php

declare(strict_types=1);

namespace App\Entity;

use App\DataObject\CriarMediaItemDTO;
use App\DataObject\IngestarMediaDTO;
use App\Enum\OrigemMedia;
use App\Enum\StatusMediaItem;
use App\Exception\MediaItem\MediaItemException;
use App\Repository\MediaItemRepository;
use App\Support\MetadataKeys;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: MediaItemRepository::class)]
#[ORM\Table(name: 'media_item')]
#[ORM\UniqueConstraint(name: 'UNIQ_MEDIA_ITEM_HASH', fields: ['hash'])]
#[ORM\Index(name: 'IDX_MEDIA_ITEM_DATA_EXIBICAO', fields: ['dataExibicao'])]
class MediaItem
{
    private const array CHAVES_METADATA_GOOGLE_FOTOS = [
        MetadataKeys::GOOGLE_PHOTOS_ID,
        MetadataKeys::GOOGLE_PHOTOS_ALBUM_ID,
        MetadataKeys::GOOGLE_PHOTOS_UPLOADED_AT,
        MetadataKeys::GOOGLE_PHOTOS_FORCADO,
    ];

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private ?Uuid $uuid = null;

    #[ORM\Column(type: 'string', length: 64, unique: true)]
    private string $hash;

    #[ORM\Column(type: 'string', enumType: OrigemMedia::class)]
    private OrigemMedia $origem;

    #[ORM\Column(type: 'string', enumType: StatusMediaItem::class)]
    private StatusMediaItem $status;

    #[ORM\Column(type: 'string', length: 512, nullable: true)]
    private ?string $caminhoLocal = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $googlePhotosMediaId = null;

    #[ORM\Column(type: 'string', length: 36, nullable: true)]
    private ?string $categoriaId = null;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $thumbnailUrl = null;

    /**
     * @var array<string, mixed>
     */
    #[ORM\Column(type: 'json')]
    private array $metadata = [];

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $erroMotivo = null;

    /**
     * @var array<int, array{de?: string, para: string, em: string}>
     */
    #[ORM\Column(type: 'json')]
    private array $historicoStatus = [];

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $dataExibicao;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $atualizadoEm;

    public function __construct(
        string $hash,
        OrigemMedia|string $origem,
        StatusMediaItem|string $status = StatusMediaItem::RECEBIDO,
    ) {
        $this->uuid = Uuid::v7();
        $this->hash = $hash;
        $this->origem = is_string($origem) ? (OrigemMedia::tryFrom($origem) ?? OrigemMedia::MANUAL) : $origem;
        $this->status = is_string($status) ? (StatusMediaItem::tryFrom($status) ?? StatusMediaItem::RECEBIDO) : $status;
        $this->caminhoLocal = null;
        $this->googlePhotosMediaId = null;
        $this->categoriaId = null;
        $this->thumbnailUrl = null;
        $this->metadata = [];
        $this->erroMotivo = null;
        $agora = new \DateTimeImmutable();
        $this->criadoEm = $agora;
        $this->dataExibicao = $agora;
        $this->atualizadoEm = $agora;
        $this->historicoStatus = [
            [
                'para' => $this->status->value,
                'em' => $agora->format(\DateTimeInterface::ATOM),
            ],
        ];
    }

    public static function fromIngestaoDTO(IngestarMediaDTO $dto, string $hash): self
    {
        $item = new self(
            hash: $hash,
            origem: $dto->origem(),
            status: StatusMediaItem::RECEBIDO,
        );
        $item->setCaminhoLocal($dto->caminhoArquivo());
        if (!empty($dto->metadata())) {
            $item->setMetadata($dto->metadata());
            if (isset($dto->metadata()[MetadataKeys::THUMBNAIL]) && is_string($dto->metadata()[MetadataKeys::THUMBNAIL])) {
                $item->setThumbnailUrl($dto->metadata()[MetadataKeys::THUMBNAIL]);
            }
        }

        return $item;
    }

    public static function fromDTO(CriarMediaItemDTO $dto): self
    {
        $item = new self(
            hash: $dto->hash(),
            origem: $dto->origem(),
            status: $dto->status(),
        );

        if (null !== $dto->caminhoLocal()) {
            $item->setCaminhoLocal($dto->caminhoLocal());
        }

        if (null !== $dto->googlePhotosMediaId()) {
            $item->setGoogleFotosId($dto->googlePhotosMediaId());
        }

        if (null !== $dto->categoriaId()) {
            $item->setCategoriaId($dto->categoriaId());
        }

        if (null !== $dto->thumbnailUrl()) {
            $item->setThumbnailUrl($dto->thumbnailUrl());
        }

        if (!empty($dto->metadata())) {
            $item->setMetadata($dto->metadata());
            if (null === $item->thumbnailUrl() && isset($dto->metadata()[MetadataKeys::THUMBNAIL]) && is_string($dto->metadata()[MetadataKeys::THUMBNAIL])) {
                $item->setThumbnailUrl($dto->metadata()[MetadataKeys::THUMBNAIL]);
            }
        }

        return $item;
    }

    public function uuid(): ?Uuid
    {
        return $this->uuid;
    }

    public function uuidTexto(): string
    {
        return (string) $this->uuid?->toString();
    }

    public function hash(): string
    {
        return $this->hash;
    }

    public function setHash(string $hash): self
    {
        $this->hash = $hash;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function origem(): OrigemMedia
    {
        return $this->origem;
    }

    public function setOrigem(OrigemMedia|string $origem): self
    {
        $this->origem = is_string($origem) ? (OrigemMedia::tryFrom($origem) ?? OrigemMedia::MANUAL) : $origem;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function classificarComo(Categoria $categoria): self
    {
        $this->categoriaId = $categoria->uuid()?->toString() ?? $this->categoriaId;
        unset($this->metadata[MetadataKeys::CATEGORIA_REMOVIDA_ID]);
        $this->transicionarPara(StatusMediaItem::CLASSIFICADO);

        return $this;
    }

    public function removerCategoria(): self
    {
        if (!$this->isRemocaoCategoriaPermitida()) {
            throw MediaItemException::remocaoDeCategoriaNaoPermitida();
        }

        $this->metadata[MetadataKeys::CATEGORIA_REMOVIDA_ID] = $this->categoriaId;
        foreach (self::CHAVES_METADATA_GOOGLE_FOTOS as $chave) {
            unset($this->metadata[$chave]);
        }

        $this->categoriaId = null;
        $this->googlePhotosMediaId = null;
        $this->erroMotivo = null;
        $this->transicionarPara(StatusMediaItem::SEM_CATEGORIA);

        return $this;
    }

    public function isRemocaoCategoriaPermitida(): bool
    {
        return $this->isClassificado() && $this->status->isRemocaoCategoriaPermitida();
    }

    public function isCategoriaRemovida(): bool
    {
        return array_key_exists(MetadataKeys::CATEGORIA_REMOVIDA_ID, $this->metadata);
    }

    public function isClassificado(): bool
    {
        return null !== $this->categoriaId && '' !== trim($this->categoriaId);
    }

    public function isSemCategoria(): bool
    {
        return $this->status->isSemCategoria();
    }

    public function isFinal(): bool
    {
        return $this->status->isFinal();
    }

    public function isClassificadoOuFinalizado(): bool
    {
        return $this->isFinal() || StatusMediaItem::CLASSIFICADO === $this->status || $this->isClassificado();
    }

    public function isElegivelParaClassificacao(): bool
    {
        return !$this->isClassificadoOuFinalizado();
    }

    public function marcarParaDownload(): self
    {
        $this->erroMotivo = null;
        $this->transicionarPara(StatusMediaItem::BAIXANDO);

        return $this;
    }

    public function limparErro(): self
    {
        $this->erroMotivo = null;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function registrarErro(string $motivo): self
    {
        $this->erroMotivo = $motivo;
        $this->transicionarPara(StatusMediaItem::ERRO);

        return $this;
    }

    public function status(): StatusMediaItem
    {
        return $this->status;
    }

    public function transicionarPara(StatusMediaItem|string $novoStatus): self
    {
        $statusAlvo = is_string($novoStatus) ? (StatusMediaItem::tryFrom($novoStatus) ?? StatusMediaItem::ERRO) : $novoStatus;

        if (!$this->status->podeTransicionarPara($statusAlvo)) {
            throw MediaItemException::transicaoDeStatusInvalida($this->status->value, $statusAlvo->value);
        }

        $deStatus = $this->status->value;
        $this->status = $statusAlvo;
        $agora = new \DateTimeImmutable();
        $this->atualizadoEm = $agora;

        $this->historicoStatus[] = [
            'de' => $deStatus,
            'para' => $statusAlvo->value,
            'em' => $agora->format(\DateTimeInterface::ATOM),
        ];

        return $this;
    }

    /**
     * @return array<int, array{de?: string, para: string, em: string}>
     */
    public function historicoStatus(): array
    {
        return $this->historicoStatus;
    }

    /**
     * @param array<int, array{de?: string, para: string, em: string}> $historicoStatus
     */
    public function setHistoricoStatus(array $historicoStatus): self
    {
        $this->historicoStatus = $historicoStatus;

        return $this;
    }

    public function setStatus(StatusMediaItem|string $status): self
    {
        return $this->transicionarPara($status);
    }

    public function caminhoLocal(): ?string
    {
        return $this->caminhoLocal;
    }

    public function setCaminhoLocal(?string $caminhoLocal): self
    {
        $this->caminhoLocal = $caminhoLocal;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function googleFotosId(): ?string
    {
        return $this->googlePhotosMediaId;
    }

    public function setGoogleFotosId(?string $googleFotosId): self
    {
        $this->googlePhotosMediaId = $googleFotosId;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function categoriaId(): ?string
    {
        return $this->categoriaId;
    }

    public function setCategoriaId(?string $categoriaId): self
    {
        $this->categoriaId = $categoriaId;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function thumbnailUrl(): ?string
    {
        return $this->thumbnailUrl;
    }

    public function setThumbnailUrl(?string $thumbnailUrl): self
    {
        $this->thumbnailUrl = $thumbnailUrl;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function metadata(): array
    {
        return $this->metadata;
    }

    /**
     * @param array<string, mixed> $metadata
     */
    public function setMetadata(array $metadata): self
    {
        $this->metadata = $metadata;
        $this->sincronizarDataExibicao();
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function adicionarMetadata(string $chave, mixed $valor): self
    {
        $this->metadata[$chave] = $valor;
        $this->sincronizarDataExibicao();
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    /**
     * @param array<string, mixed> $novosMetadados
     */
    public function mesclarMetadata(array $novosMetadados): self
    {
        $this->metadata = array_merge($this->metadata, $novosMetadados);
        $this->sincronizarDataExibicao();
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function isEnviadoGoogleFotos(): bool
    {
        return null !== $this->googlePhotosMediaId && '' !== trim($this->googlePhotosMediaId);
    }

    public function isDuplicado(): bool
    {
        return (bool) ($this->metadata[MetadataKeys::DUPLICADO] ?? false);
    }

    public function marcarComoDuplicado(self $original): self
    {
        $this->metadata[MetadataKeys::DUPLICADO] = true;
        $this->metadata[MetadataKeys::DUPLICADO_DE_UUID] = $original->uuid()?->toString();
        $this->metadata[MetadataKeys::DATA_DETECCAO_DUPLICADO] = (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM);

        if ($original->isEnviadoGoogleFotos() && !$this->isEnviadoGoogleFotos()) {
            $this->googlePhotosMediaId = $original->googleFotosId();
            $this->metadata[MetadataKeys::GOOGLE_PHOTOS_ID] = $original->googleFotosId();
        }

        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function erroMotivo(): ?string
    {
        return $this->erroMotivo;
    }

    public function setErroMotivo(?string $erroMotivo): self
    {
        $this->erroMotivo = $erroMotivo;
        $this->atualizadoEm = new \DateTimeImmutable();

        return $this;
    }

    public function criadoEm(): \DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function setCriadoEm(\DateTimeImmutable $criadoEm): self
    {
        $this->criadoEm = $criadoEm;
        $this->sincronizarDataExibicao();

        return $this;
    }

    public function dataExibicao(): \DateTimeImmutable
    {
        return $this->dataExibicao;
    }

    /**
     * @param array<string, mixed> $metadata
     */
    public static function resolverDataExibicao(array $metadata, \DateTimeImmutable $fallback): \DateTimeImmutable
    {
        $data = $metadata[MetadataKeys::DATA] ?? null;
        if (!is_string($data) || '' === trim($data)) {
            return $fallback;
        }

        $horario = isset($metadata['horario']) && is_string($metadata['horario']) ? $metadata['horario'] : null;
        $fuso = new \DateTimeZone('America/Sao_Paulo');
        $dataLimpa = trim($data);

        if (preg_match('/^(\d{4})(\d{2})(\d{2})$/', $dataLimpa, $partes)) {
            $dataLimpa = sprintf('%s-%s-%s', $partes[1], $partes[2], $partes[3]);
        }

        if (!str_contains($dataLimpa, ':') && null !== $horario && '' !== trim($horario)) {
            $horarioLimpo = trim($horario);
            if (preg_match('/^\d{1,2}:\d{2}$/', $horarioLimpo)) {
                $horarioLimpo .= ':00';
            }
            $dataLimpa .= ' ' . $horarioLimpo;
        } elseif (!str_contains($dataLimpa, ':')) {
            $dataLimpa .= ' 12:00:00';
        }

        try {
            $temFusoExplicito = str_contains($dataLimpa, 'Z') || 1 === preg_match('/[+-]\d{2}:?\d{2}$/', $dataLimpa);
            if ($temFusoExplicito) {
                $local = (new \DateTimeImmutable($dataLimpa))->setTimezone($fuso);

                return new \DateTimeImmutable($local->format('Y-m-d H:i:s'), $fuso);
            }

            return new \DateTimeImmutable($dataLimpa, $fuso);
        } catch (\Throwable) {
            return $fallback;
        }
    }

    private function sincronizarDataExibicao(): void
    {
        $this->dataExibicao = self::resolverDataExibicao($this->metadata, $this->criadoEm);
    }

    public function atualizadoEm(): \DateTimeImmutable
    {
        return $this->atualizadoEm;
    }

    public function setAtualizadoEm(\DateTimeImmutable $atualizadoEm): self
    {
        $this->atualizadoEm = $atualizadoEm;

        return $this;
    }

    public function tamanhoBytes(): int
    {
        if (isset($this->metadata['tamanho_bytes'])) {
            return (int) $this->metadata['tamanho_bytes'];
        }

        if (isset($this->metadata['filesize'])) {
            return (int) $this->metadata['filesize'];
        }

        if (isset($this->metadata['size'])) {
            return (int) $this->metadata['size'];
        }

        if (null !== $this->caminhoLocal && file_exists($this->caminhoLocal)) {
            return (int) @filesize($this->caminhoLocal);
        }

        return 0;
    }

    public function isArquivoRemovido(): bool
    {
        return StatusMediaItem::ARQUIVO_REMOVIDO === $this->status || StatusMediaItem::ARQUIVO_EXPURGADO === $this->status;
    }

    public function isArquivoExpurgado(): bool
    {
        return $this->isArquivoRemovido();
    }

    public function isPrint(): bool
    {
        return in_array($this->origem, [OrigemMedia::PRINT_PESSOAL, OrigemMedia::PRINT_EMPRESA], true);
    }

    public function isEditavelComoImagem(): bool
    {
        return !$this->isVideo() && !$this->isArquivoRemovido();
    }

    public function isVideo(): bool
    {
        if ($this->isPrint()) {
            return false;
        }

        if (in_array($this->origem, [OrigemMedia::DOWNLOAD, OrigemMedia::BOT_TELEGRAM], true)) {
            return true;
        }

        $caminho = strtolower((string) ($this->caminhoLocal ?? ''));
        if ('' !== $caminho && preg_match('/\.(mp4|mkv|webm|mov|avi|flv)$/i', $caminho)) {
            return true;
        }

        $mime = (string) ($this->metadata['mime_type'] ?? '');
        if (str_starts_with($mime, 'video/')) {
            return true;
        }

        $ext = (string) ($this->metadata['extensao'] ?? '');
        if ('' !== $ext && preg_match('/^(mp4|mkv|webm|mov|avi|flv)$/i', $ext)) {
            return true;
        }

        return false;
    }
}
