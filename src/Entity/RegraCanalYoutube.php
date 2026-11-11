<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\ClassificacaoCanal;
use App\Repository\RegraCanalYoutubeRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: RegraCanalYoutubeRepository::class)]
#[ORM\Table(name: 'regra_canal_youtube')]
#[ORM\UniqueConstraint(name: 'UNIQ_REGRA_CANAL_YOUTUBE_USUARIO_CANAL', fields: ['usuario', 'canalNormalizado'])]
class RegraCanalYoutube
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\Column(type: 'string', length: 255)]
    private string $canalNormalizado;

    #[ORM\Column(type: 'string', length: 20, enumType: ClassificacaoCanal::class)]
    private ClassificacaoCanal $classificacao;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $criadoEm;

    public function __construct(Usuario $usuario, string $canalNormalizado, ClassificacaoCanal $classificacao)
    {
        $this->uuid = Uuid::v7();
        $this->usuario = $usuario;
        $this->canalNormalizado = $canalNormalizado;
        $this->classificacao = $classificacao;
        $this->criadoEm = new DateTimeImmutable();
    }

    public function reclassificar(ClassificacaoCanal $classificacao): self
    {
        $this->classificacao = $classificacao;

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

    public function canalNormalizado(): string
    {
        return $this->canalNormalizado;
    }

    public function classificacao(): ClassificacaoCanal
    {
        return $this->classificacao;
    }

    public function criadoEm(): DateTimeImmutable
    {
        return $this->criadoEm;
    }
}
