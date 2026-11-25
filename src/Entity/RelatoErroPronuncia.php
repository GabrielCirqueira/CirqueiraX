<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\StatusRelatoPronuncia;
use App\Enum\TipoErroPronuncia;
use App\Repository\RelatoErroPronunciaRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: RelatoErroPronunciaRepository::class)]
#[ORM\Table(name: 'relato_erro_pronuncia')]
#[ORM\Index(name: 'IDX_RELATO_PRONUNCIA_STATUS_CRIADO', fields: ['status', 'criadoEm'])]
class RelatoErroPronuncia
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: FrasePronuncia::class)]
    #[ORM\JoinColumn(name: 'frase_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private FrasePronuncia $frase;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Usuario $usuario;

    #[ORM\Column(type: 'string', length: 20, enumType: TipoErroPronuncia::class)]
    private TipoErroPronuncia $tipo;

    #[ORM\Column(type: 'string', length: 80, nullable: true)]
    private ?string $palavra;

    #[ORM\Column(type: 'string', length: 500, nullable: true)]
    private ?string $comentario;

    #[ORM\Column(type: 'text')]
    private string $textoInglesAntes;

    #[ORM\Column(type: 'text')]
    private string $pronunciaAntes;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $sugestaoTraducao = null;

    /**
     * @var list<array{palavra: string, pronuncia: string}>
     */
    #[ORM\Column(type: 'json')]
    private array $sugestaoPalavras = [];

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $explicacaoSugestao = null;

    #[ORM\Column(type: 'string', length: 20, enumType: StatusRelatoPronuncia::class)]
    private StatusRelatoPronuncia $status;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $criadoEm;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $resolvidoEm = null;

    public function __construct(
        FrasePronuncia $frase,
        ?Usuario $usuario,
        TipoErroPronuncia $tipo,
        ?string $palavra,
        ?string $comentario,
    ) {
        $this->uuid = Uuid::v7();
        $this->frase = $frase;
        $this->usuario = $usuario;
        $this->tipo = $tipo;
        $this->palavra = $palavra;
        $this->comentario = $comentario;
        $this->textoInglesAntes = $frase->textoIngles();
        $this->pronunciaAntes = $frase->pronunciaResumida();
        $this->status = StatusRelatoPronuncia::Pendente;
        $this->criadoEm = new \DateTimeImmutable();
    }

    /**
     * @param list<array{palavra: string, pronuncia: string}> $palavras
     */
    public function registrarSugestao(?string $traducao, array $palavras, ?string $explicacao): void
    {
        $this->sugestaoTraducao = $traducao;
        $this->sugestaoPalavras = $palavras;
        $this->explicacaoSugestao = $explicacao;
        $this->status = StatusRelatoPronuncia::Sugerido;
    }

    public function aprovar(): void
    {
        $this->status = StatusRelatoPronuncia::Aprovado;
        $this->resolvidoEm = new \DateTimeImmutable();
    }

    public function rejeitar(): void
    {
        $this->status = StatusRelatoPronuncia::Rejeitado;
        $this->resolvidoEm = new \DateTimeImmutable();
    }

    public function isEmAberto(): bool
    {
        return $this->status->isEmAberto();
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function frase(): FrasePronuncia
    {
        return $this->frase;
    }

    public function usuario(): ?Usuario
    {
        return $this->usuario;
    }

    public function tipo(): TipoErroPronuncia
    {
        return $this->tipo;
    }

    public function palavra(): ?string
    {
        return $this->palavra;
    }

    public function comentario(): ?string
    {
        return $this->comentario;
    }

    public function textoInglesAntes(): string
    {
        return $this->textoInglesAntes;
    }

    public function pronunciaAntes(): string
    {
        return $this->pronunciaAntes;
    }

    public function sugestaoTraducao(): ?string
    {
        return $this->sugestaoTraducao;
    }

    /**
     * @return list<array{palavra: string, pronuncia: string}>
     */
    public function sugestaoPalavras(): array
    {
        return $this->sugestaoPalavras;
    }

    public function explicacaoSugestao(): ?string
    {
        return $this->explicacaoSugestao;
    }

    public function status(): StatusRelatoPronuncia
    {
        return $this->status;
    }

    public function criadoEm(): \DateTimeImmutable
    {
        return $this->criadoEm;
    }

    public function resolvidoEm(): ?\DateTimeImmutable
    {
        return $this->resolvidoEm;
    }
}
