<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\ArtistaCatalogoRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ArtistaCatalogoRepository::class)]
#[ORM\Table(name: 'artista_catalogo')]
#[ORM\UniqueConstraint(name: 'UNIQ_ARTISTA_CATALOGO_USUARIO_NOME', fields: ['usuario', 'nomeNormalizado'])]
class ArtistaCatalogo
{
    private const int TAMANHO_MAXIMO_NOME = 255;
    private const int PROFUNDIDADE_MAXIMA_UNIAO = 10;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 255)]
    private string $nome;

    #[ORM\Column(type: 'string', length: 255)]
    private string $nomeNormalizado;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    private ?string $urlFoto = null;

    #[ORM\ManyToOne(targetEntity: self::class)]
    #[ORM\JoinColumn(name: 'unido_a_uuid', referencedColumnName: 'uuid', nullable: true, onDelete: 'SET NULL')]
    private ?ArtistaCatalogo $unidoA = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    public function __construct(Usuario $usuario, string $nome, string $nomeNormalizado)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->nome = mb_substr($nome, 0, self::TAMANHO_MAXIMO_NOME);
        $this->nomeNormalizado = mb_substr($nomeNormalizado, 0, self::TAMANHO_MAXIMO_NOME);
        $this->criadoEm = new DateTimeImmutable();
    }

    public function definirFoto(?string $urlFoto): self
    {
        $this->urlFoto = $urlFoto;

        return $this;
    }

    public function unirA(self $destino): self
    {
        $this->unidoA = $destino;

        return $this;
    }

    public function desfazerUniao(): self
    {
        $this->unidoA = null;

        return $this;
    }

    public function artistaEfetivo(): self
    {
        $atual = $this;
        for ($passo = 0; null !== $atual->unidoA && $passo < self::PROFUNDIDADE_MAXIMA_UNIAO; ++$passo) {
            $atual = $atual->unidoA;
        }

        return $atual;
    }

    public function unidoA(): ?self
    {
        return $this->unidoA;
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function usuario(): Usuario
    {
        return $this->usuario;
    }

    public function nome(): string
    {
        return $this->nome;
    }

    public function nomeNormalizado(): string
    {
        return $this->nomeNormalizado;
    }

    public function urlFoto(): ?string
    {
        return $this->urlFoto;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }
}
