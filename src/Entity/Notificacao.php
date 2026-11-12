<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\TipoNotificacao;
use App\Repository\NotificacaoRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: NotificacaoRepository::class)]
#[ORM\Table(name: 'notificacao')]
#[ORM\Index(name: 'IDX_NOTIFICACAO_USUARIO_CRIADO', fields: ['usuario', 'criadoEm'])]
#[ORM\Index(name: 'IDX_NOTIFICACAO_USUARIO_LIDA', fields: ['usuario', 'lidaEm'])]
class Notificacao
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 20, enumType: TipoNotificacao::class)]
    private TipoNotificacao $tipo;

    #[ORM\Column(type: 'string', length: 160)]
    private string $titulo;

    #[ORM\Column(type: 'text')]
    private string $mensagem;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $lidaEm = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    public function __construct(Usuario $usuario, TipoNotificacao $tipo, string $titulo, string $mensagem)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->tipo = $tipo;
        $this->titulo = $titulo;
        $this->mensagem = $mensagem;
        $this->criadoEm = new DateTimeImmutable();
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function tipo(): TipoNotificacao
    {
        return $this->tipo;
    }

    public function titulo(): string
    {
        return $this->titulo;
    }

    public function mensagem(): string
    {
        return $this->mensagem;
    }

    public function lidaEm(): ?DateTimeImmutable
    {
        return $this->lidaEm;
    }

    public function isLida(): bool
    {
        return null !== $this->lidaEm;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }
}
