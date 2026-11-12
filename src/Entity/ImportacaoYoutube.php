<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\EtapaImportacaoYoutube;
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

    #[ORM\Column(type: 'string', length: 20, enumType: EtapaImportacaoYoutube::class)]
    private EtapaImportacaoYoutube $etapa;

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

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $primeiraReproducaoEm = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $ultimaReproducaoEm = null;

    #[ORM\Column(type: 'integer')]
    private int $totalDescartadosRegra = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalIndisponiveis = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalSemIa = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalParaIa = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalClassificados = 0;

    #[ORM\Column(type: 'integer')]
    private int $tokensEntradaEstimados = 0;

    #[ORM\Column(type: 'integer')]
    private int $tokensSaidaEstimados = 0;

    #[ORM\Column(type: 'bigint')]
    private int $custoEstimadoMicrodolares = 0;

    #[ORM\Column(type: 'integer')]
    private int $tokensEntradaReais = 0;

    #[ORM\Column(type: 'integer')]
    private int $tokensSaidaReais = 0;

    #[ORM\Column(type: 'bigint')]
    private int $custoRealMicrodolares = 0;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $classificacaoIniciadaEm = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $confirmadaEm = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $tempoCalculadoAte = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $relatorioVistoEm = null;

    /**
     * @var array<string, mixed>|null
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $relatorio = null;

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
        $this->etapa = EtapaImportacaoYoutube::Leitura;
        $this->criadoEm = new DateTimeImmutable();
    }

    public function iniciarProcessamento(): self
    {
        $this->status = StatusImportacaoYoutube::Processando;
        $this->iniciadoEm = new DateTimeImmutable();

        return $this;
    }

    public function registrarLeitura(
        int $totalLidos,
        int $totalDescartados,
        int $totalNovos,
        int $totalIgnorados,
        int $totalUnificados,
        int $totalVideosNovos,
        ?DateTimeImmutable $primeiraReproducaoEm,
        ?DateTimeImmutable $ultimaReproducaoEm,
    ): self {
        $this->totalLidos = $totalLidos;
        $this->totalDescartados = $totalDescartados;
        $this->totalNovos = $totalNovos;
        $this->totalIgnorados = $totalIgnorados;
        $this->totalUnificados = $totalUnificados;
        $this->totalVideosNovos = $totalVideosNovos;
        $this->primeiraReproducaoEm = $primeiraReproducaoEm;
        $this->ultimaReproducaoEm = $ultimaReproducaoEm;
        $this->etapa = EtapaImportacaoYoutube::Enriquecimento;

        return $this;
    }

    public function avancarPara(EtapaImportacaoYoutube $etapa): self
    {
        $this->etapa = $etapa;

        return $this;
    }

    public function registrarFiltro(int $totalDescartadosRegra, int $totalIndisponiveis): self
    {
        $this->totalDescartadosRegra = $totalDescartadosRegra;
        $this->totalIndisponiveis = $totalIndisponiveis;
        $this->etapa = EtapaImportacaoYoutube::Previa;

        return $this;
    }

    public function registrarPrevia(int $totalSemIa, int $totalParaIa, int $tokensEntrada, int $tokensSaida, int $custoMicrodolares): self
    {
        $this->totalSemIa = $totalSemIa;
        $this->totalParaIa = $totalParaIa;
        $this->tokensEntradaEstimados = $tokensEntrada;
        $this->tokensSaidaEstimados = $tokensSaida;
        $this->custoEstimadoMicrodolares = $custoMicrodolares;

        return $this;
    }

    public function aguardarConfirmacao(): self
    {
        $this->status = StatusImportacaoYoutube::AguardandoConfirmacao;

        return $this;
    }

    public function iniciarClassificacao(): self
    {
        $this->status = StatusImportacaoYoutube::Classificando;
        $this->etapa = EtapaImportacaoYoutube::Classificacao;
        $this->classificacaoIniciadaEm ??= new DateTimeImmutable();

        return $this;
    }

    public function confirmar(): self
    {
        $this->confirmadaEm = new DateTimeImmutable();

        return $this->iniciarClassificacao();
    }

    public function pularClassificacao(): self
    {
        return $this->iniciarTempoOuvido();
    }

    public function registrarClassificados(int $quantidade, int $tokensEntrada, int $tokensSaida, int $custoMicrodolares): self
    {
        $this->totalClassificados += $quantidade;
        $this->tokensEntradaReais = $tokensEntrada;
        $this->tokensSaidaReais = $tokensSaida;
        $this->custoRealMicrodolares = $custoMicrodolares;

        return $this;
    }

    public function iniciarTempoOuvido(): self
    {
        $this->status = StatusImportacaoYoutube::Processando;
        $this->etapa = EtapaImportacaoYoutube::TempoOuvido;

        return $this;
    }

    public function registrarTempoCalculadoAte(DateTimeImmutable $momento): self
    {
        $this->tempoCalculadoAte = $momento;

        return $this;
    }

    /**
     * @param array<string, mixed> $relatorio
     */
    public function concluir(array $relatorio): self
    {
        $this->relatorio = $relatorio;
        $this->status = StatusImportacaoYoutube::Concluida;
        $this->etapa = EtapaImportacaoYoutube::Concluida;
        $this->concluidoEm = new DateTimeImmutable();

        return $this;
    }

    public function retomar(): self
    {
        $this->status = EtapaImportacaoYoutube::Classificacao === $this->etapa ? StatusImportacaoYoutube::Classificando : StatusImportacaoYoutube::Processando;
        $this->erroMotivo = null;
        $this->concluidoEm = null;

        return $this;
    }

    public function isErro(): bool
    {
        return StatusImportacaoYoutube::Erro === $this->status;
    }

    public function isAguardandoConfirmacao(): bool
    {
        return StatusImportacaoYoutube::AguardandoConfirmacao === $this->status;
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

    public function etapa(): EtapaImportacaoYoutube
    {
        return $this->etapa;
    }

    public function primeiraReproducaoEm(): ?DateTimeImmutable
    {
        return $this->primeiraReproducaoEm;
    }

    public function ultimaReproducaoEm(): ?DateTimeImmutable
    {
        return $this->ultimaReproducaoEm;
    }

    public function totalDescartadosRegra(): int
    {
        return $this->totalDescartadosRegra;
    }

    public function totalIndisponiveis(): int
    {
        return $this->totalIndisponiveis;
    }

    public function totalSemIa(): int
    {
        return $this->totalSemIa;
    }

    public function totalParaIa(): int
    {
        return $this->totalParaIa;
    }

    public function totalClassificados(): int
    {
        return $this->totalClassificados;
    }

    public function tokensEntradaEstimados(): int
    {
        return $this->tokensEntradaEstimados;
    }

    public function tokensSaidaEstimados(): int
    {
        return $this->tokensSaidaEstimados;
    }

    public function custoEstimadoMicrodolares(): int
    {
        return $this->custoEstimadoMicrodolares;
    }

    public function tokensEntradaReais(): int
    {
        return $this->tokensEntradaReais;
    }

    public function tokensSaidaReais(): int
    {
        return $this->tokensSaidaReais;
    }

    public function custoRealMicrodolares(): int
    {
        return $this->custoRealMicrodolares;
    }

    public function classificacaoIniciadaEm(): ?DateTimeImmutable
    {
        return $this->classificacaoIniciadaEm;
    }

    public function confirmadaEm(): ?DateTimeImmutable
    {
        return $this->confirmadaEm;
    }

    public function tempoCalculadoAte(): ?DateTimeImmutable
    {
        return $this->tempoCalculadoAte;
    }

    public function marcarRelatorioVisto(): self
    {
        $this->relatorioVistoEm ??= new DateTimeImmutable();

        return $this;
    }

    public function relatorioVistoEm(): ?DateTimeImmutable
    {
        return $this->relatorioVistoEm;
    }

    public function isEsperandoVez(): bool
    {
        return StatusImportacaoYoutube::Enviada === $this->status && EtapaImportacaoYoutube::Leitura === $this->etapa;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function relatorio(): ?array
    {
        return $this->relatorio;
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
