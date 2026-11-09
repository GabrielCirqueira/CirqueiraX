<?php

declare(strict_types=1);

namespace App\Entity;

use App\DataObject\Transcricao\SegmentoTranscricaoDTO;
use App\Enum\IdiomaTranscricao;
use App\Enum\StatusCorrecaoTranscricao;
use App\Enum\StatusTranscricao;
use App\Repository\TranscricaoRepository;
use DateTimeImmutable;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: TranscricaoRepository::class)]
#[ORM\Table(name: 'transcricao')]
#[ORM\Index(name: 'IDX_TRANSCRICAO_USUARIO_CRIADO_EM', fields: ['usuario', 'criadoEm'])]
#[ORM\Index(name: 'IDX_TRANSCRICAO_STATUS_CRIADO_EM', fields: ['status', 'criadoEm'])]
class Transcricao
{
    public const int DIAS_RETENCAO_AUDIO = 7;
    public const float FATOR_TEMPO_PROCESSAMENTO = 1.3;
    private const int PROGRESSO_MAXIMO = 100;
    private const int TAMANHO_PREVIA = 280;
    private const float PAUSA_NOVO_PARAGRAFO_SEGUNDOS = 1.5;
    private const string SEPARADOR_PARAGRAFO = "\n\n";
    private const string SEPARADOR_FRASE = ' ';
    private const string PADRAO_PALAVRAS = '/[\p{L}\p{N}]+/u';
    private const string PREFIXO_MIME_VIDEO = 'video/';
    private const string MIME_AUDIO_EXTRAIDO = 'audio/mp4';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: Types::STRING, length: 255)]
    private string $titulo;

    #[ORM\Column(type: Types::STRING, length: 255)]
    private string $nomeArquivoOriginal;

    #[ORM\Column(type: Types::STRING, length: 120, nullable: true)]
    private ?string $mimeType;

    #[ORM\Column(type: Types::STRING, length: 512, nullable: true)]
    private ?string $caminhoArquivo = null;

    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    private ?int $tamanhoBytes;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $duracaoSegundos = null;

    #[ORM\Column(type: Types::STRING, length: 10, enumType: IdiomaTranscricao::class)]
    private IdiomaTranscricao $idiomaSolicitado;

    #[ORM\Column(type: Types::STRING, length: 10, nullable: true)]
    private ?string $idiomaDetectado = null;

    #[ORM\Column(type: Types::STRING, length: 20, enumType: StatusTranscricao::class)]
    private StatusTranscricao $status;

    #[ORM\Column(type: Types::SMALLINT)]
    private int $progresso = 0;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $texto = null;

    /**
     * @var list<array{inicio: float, fim: float, texto: string}>|null
     */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $segmentos = null;

    #[ORM\Column(type: Types::INTEGER)]
    private int $totalPalavras = 0;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $erroMotivo = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    private bool $favorita = false;

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => false])]
    private bool $origemVideo = false;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $textoCorrigido = null;

    #[ORM\Column(type: Types::STRING, length: 20, nullable: true, enumType: StatusCorrecaoTranscricao::class)]
    private ?StatusCorrecaoTranscricao $statusCorrecao = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $erroCorrecao = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?DateTimeImmutable $corrigidoEm = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private DateTimeImmutable $criadoEm;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private DateTimeImmutable $atualizadoEm;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?DateTimeImmutable $iniciadoEm = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?DateTimeImmutable $concluidoEm = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?DateTimeImmutable $audioExpiradoEm = null;

    public function __construct(
        Usuario $usuario,
        string $titulo,
        string $nomeArquivoOriginal,
        ?string $mimeType,
        ?int $tamanhoBytes,
        IdiomaTranscricao $idiomaSolicitado,
    ) {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->titulo = $titulo;
        $this->nomeArquivoOriginal = $nomeArquivoOriginal;
        $this->mimeType = $mimeType;
        $this->tamanhoBytes = $tamanhoBytes;
        $this->idiomaSolicitado = $idiomaSolicitado;
        $this->status = StatusTranscricao::NA_FILA;
        $this->criadoEm = new DateTimeImmutable();
        $this->atualizadoEm = $this->criadoEm;
    }

    public function anexarAudio(string $caminhoArquivo, ?float $duracaoSegundos): self
    {
        $this->caminhoArquivo = $caminhoArquivo;
        $this->duracaoSegundos = $duracaoSegundos;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function substituirVideoPorAudio(string $caminhoAudio): self
    {
        $this->caminhoArquivo = $caminhoAudio;
        $this->mimeType = self::MIME_AUDIO_EXTRAIDO;
        $this->origemVideo = true;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function solicitarCorrecao(): self
    {
        $this->statusCorrecao = StatusCorrecaoTranscricao::NA_FILA;
        $this->erroCorrecao = null;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function iniciarCorrecao(): self
    {
        $this->statusCorrecao = StatusCorrecaoTranscricao::CORRIGINDO;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function concluirCorrecao(string $textoCorrigido): self
    {
        $this->textoCorrigido = $textoCorrigido;
        $this->statusCorrecao = StatusCorrecaoTranscricao::CONCLUIDA;
        $this->erroCorrecao = null;
        $this->corrigidoEm = new DateTimeImmutable();
        $this->atualizadoEm = $this->corrigidoEm;

        return $this;
    }

    public function registrarFalhaCorrecao(string $erroCorrecao): self
    {
        $this->statusCorrecao = StatusCorrecaoTranscricao::ERRO;
        $this->erroCorrecao = $erroCorrecao;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function precisaExtrairAudioDoVideo(): bool
    {
        return !$this->origemVideo && null !== $this->mimeType && str_starts_with($this->mimeType, self::PREFIXO_MIME_VIDEO);
    }

    public function isCorrecaoEmAndamento(): bool
    {
        return null !== $this->statusCorrecao && $this->statusCorrecao->isEmAndamento();
    }

    public function isCorrigivel(): bool
    {
        return $this->status->isConcluida() && null !== $this->texto && !$this->isCorrecaoEmAndamento();
    }

    public function iniciarTranscricao(): self
    {
        $this->textoCorrigido = null;
        $this->statusCorrecao = null;
        $this->erroCorrecao = null;
        $this->corrigidoEm = null;
        $this->progresso = 0;
        $this->texto = null;
        $this->segmentos = null;
        $this->totalPalavras = 0;
        $this->erroMotivo = null;
        $this->idiomaDetectado = null;
        $this->iniciadoEm = new DateTimeImmutable();
        $this->concluidoEm = null;

        return $this->transicionarPara(StatusTranscricao::TRANSCREVENDO);
    }

    /**
     * @param list<SegmentoTranscricaoDTO> $segmentosParciais
     */
    public function registrarProgresso(int $percentual, array $segmentosParciais): self
    {
        $this->progresso = max($this->progresso, min(self::PROGRESSO_MAXIMO - 1, max(0, $percentual)));
        $this->aplicarSegmentos($segmentosParciais);
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    /**
     * @param list<SegmentoTranscricaoDTO> $segmentos
     */
    public function concluir(array $segmentos, ?string $idiomaDetectado): self
    {
        $this->aplicarSegmentos($segmentos);
        $this->idiomaDetectado = $idiomaDetectado;
        $this->progresso = self::PROGRESSO_MAXIMO;
        $this->concluidoEm = new DateTimeImmutable();
        $this->erroMotivo = null;

        return $this->transicionarPara(StatusTranscricao::CONCLUIDA);
    }

    public function registrarFalha(string $erroMotivo): self
    {
        $this->erroMotivo = $erroMotivo;
        $this->concluidoEm = new DateTimeImmutable();

        return $this->transicionarPara(StatusTranscricao::ERRO);
    }

    public function prepararParaReprocessar(?IdiomaTranscricao $idioma): self
    {
        $this->idiomaSolicitado = $idioma ?? $this->idiomaSolicitado;
        $this->progresso = 0;
        $this->erroMotivo = null;
        $this->iniciadoEm = null;
        $this->concluidoEm = null;

        return $this->transicionarPara(StatusTranscricao::NA_FILA);
    }

    public function expirarAudio(): self
    {
        $this->caminhoArquivo = null;
        $this->audioExpiradoEm = new DateTimeImmutable();
        $this->atualizadoEm = $this->audioExpiradoEm;

        return $this;
    }

    public function renomear(string $titulo): self
    {
        $this->titulo = $titulo;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function marcarFavorita(bool $favorita): self
    {
        $this->favorita = $favorita;
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function expiraAudioEm(): ?DateTimeImmutable
    {
        if (!$this->isAudioDisponivel()) {
            return null;
        }

        return $this->criadoEm->modify(sprintf('+%d days', self::DIAS_RETENCAO_AUDIO));
    }

    public function segundosRestantesEstimados(): ?int
    {
        if (!$this->status->isEmAndamento() || null === $this->duracaoSegundos) {
            return null;
        }

        $fracaoRestante = 1 - ($this->progresso / self::PROGRESSO_MAXIMO);

        return (int) ceil($this->duracaoSegundos * self::FATOR_TEMPO_PROCESSAMENTO * $fracaoRestante);
    }

    public function segundosProcessamento(): ?int
    {
        if (null === $this->iniciadoEm || null === $this->concluidoEm) {
            return null;
        }

        return max(0, $this->concluidoEm->getTimestamp() - $this->iniciadoEm->getTimestamp());
    }

    public function previaTexto(): ?string
    {
        if (null === $this->texto) {
            return null;
        }

        $textoLinear = (string) preg_replace('/\s+/u', self::SEPARADOR_FRASE, $this->texto);

        return mb_strlen($textoLinear) > self::TAMANHO_PREVIA
            ? rtrim(mb_substr($textoLinear, 0, self::TAMANHO_PREVIA)) . '…'
            : $textoLinear;
    }

    public function isAudioDisponivel(): bool
    {
        return null !== $this->caminhoArquivo && null === $this->audioExpiradoEm;
    }

    public function isEmAndamento(): bool
    {
        return $this->status->isEmAndamento();
    }

    public function isConcluida(): bool
    {
        return $this->status->isConcluida();
    }

    public function isReprocessavel(): bool
    {
        return !$this->status->isEmAndamento() && $this->isAudioDisponivel();
    }

    public function isApagavel(): bool
    {
        return !$this->status->isTranscrevendo();
    }

    /**
     * @param list<SegmentoTranscricaoDTO> $segmentos
     */
    private function aplicarSegmentos(array $segmentos): void
    {
        $this->segmentos = array_map(
            static fn (SegmentoTranscricaoDTO $segmento): array => $segmento->paraArray(),
            $segmentos,
        );
        $this->texto = [] === $segmentos ? null : $this->montarTextoCorrido($segmentos);
        $this->totalPalavras = null === $this->texto ? 0 : (int) preg_match_all(self::PADRAO_PALAVRAS, $this->texto);
    }

    /**
     * @param list<SegmentoTranscricaoDTO> $segmentos
     */
    private function montarTextoCorrido(array $segmentos): string
    {
        $texto = '';
        $fimAnterior = null;

        foreach ($segmentos as $segmento) {
            $texto .= $this->separadorAntesDe($segmento, $fimAnterior, '' === $texto) . $segmento->texto;
            $fimAnterior = $segmento->fimSegundos;
        }

        return trim($texto);
    }

    private function separadorAntesDe(SegmentoTranscricaoDTO $segmento, ?float $fimAnterior, bool $primeiro): string
    {
        if ($primeiro || null === $fimAnterior) {
            return '';
        }

        $pausa = $segmento->inicioSegundos - $fimAnterior;

        return $pausa >= self::PAUSA_NOVO_PARAGRAFO_SEGUNDOS ? self::SEPARADOR_PARAGRAFO : self::SEPARADOR_FRASE;
    }

    private function transicionarPara(StatusTranscricao $status): self
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
        return $this->uuid->toRfc4122();
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function titulo(): string
    {
        return $this->titulo;
    }

    public function nomeArquivoOriginal(): string
    {
        return $this->nomeArquivoOriginal;
    }

    public function mimeType(): ?string
    {
        return $this->mimeType;
    }

    public function caminhoArquivo(): ?string
    {
        return $this->caminhoArquivo;
    }

    public function tamanhoBytes(): ?int
    {
        return null === $this->tamanhoBytes ? null : (int) $this->tamanhoBytes;
    }

    public function duracaoSegundos(): ?float
    {
        return $this->duracaoSegundos;
    }

    public function idiomaSolicitado(): IdiomaTranscricao
    {
        return $this->idiomaSolicitado;
    }

    public function idiomaDetectado(): ?string
    {
        return $this->idiomaDetectado;
    }

    public function status(): StatusTranscricao
    {
        return $this->status;
    }

    public function progresso(): int
    {
        return $this->progresso;
    }

    public function texto(): ?string
    {
        return $this->texto;
    }

    public function isOrigemVideo(): bool
    {
        return $this->origemVideo;
    }

    public function textoCorrigido(): ?string
    {
        return $this->textoCorrigido;
    }

    public function statusCorrecao(): ?StatusCorrecaoTranscricao
    {
        return $this->statusCorrecao;
    }

    public function erroCorrecao(): ?string
    {
        return $this->erroCorrecao;
    }

    public function corrigidoEm(): ?DateTimeImmutable
    {
        return $this->corrigidoEm;
    }

    /**
     * @return list<array{inicio: float, fim: float, texto: string}>
     */
    public function segmentos(): array
    {
        return $this->segmentos ?? [];
    }

    public function totalPalavras(): int
    {
        return $this->totalPalavras;
    }

    public function erroMotivo(): ?string
    {
        return $this->erroMotivo;
    }

    public function isFavorita(): bool
    {
        return $this->favorita;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function atualizadoEm(): DateTimeImmutable
    {
        return $this->atualizadoEm;
    }

    public function iniciadoEm(): ?DateTimeImmutable
    {
        return $this->iniciadoEm;
    }

    public function concluidoEm(): ?DateTimeImmutable
    {
        return $this->concluidoEm;
    }

    public function audioExpiradoEm(): ?DateTimeImmutable
    {
        return $this->audioExpiradoEm;
    }
}
