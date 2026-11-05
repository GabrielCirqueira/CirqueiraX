<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\EscutaLivroAudioDiaRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: EscutaLivroAudioDiaRepository::class)]
#[ORM\Table(name: 'escuta_livro_audio_dia')]
#[ORM\UniqueConstraint(name: 'UNIQ_ESCUTA_LIVRO_DIA', fields: ['livro', 'dia'])]
#[ORM\Index(name: 'IDX_ESCUTA_USUARIO_DIA', fields: ['usuario', 'dia'])]
class EscutaLivroAudioDia
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    #[ORM\ManyToOne(targetEntity: LivroAudio::class)]
    #[ORM\JoinColumn(name: 'livro_uuid', referencedColumnName: 'uuid', nullable: false, onDelete: 'CASCADE')]
    private LivroAudio $livro;

    #[ORM\Column(type: 'date_immutable')]
    private DateTimeImmutable $dia;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $segundos = 0;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $atualizadoEm;

    public function __construct(LivroAudio $livro, DateTimeImmutable $dia)
    {
        $this->uuid = Uuid::v7();
        $this->livro = $livro;
        $this->usuario = $livro->usuario();
        $this->dia = $dia->setTime(0, 0);
        $this->atualizadoEm = new DateTimeImmutable();
    }

    public function somar(int $segundos): self
    {
        $this->segundos += max(0, $segundos);
        $this->atualizadoEm = new DateTimeImmutable();

        return $this;
    }

    public function livro(): LivroAudio
    {
        return $this->livro;
    }

    public function dia(): DateTimeImmutable
    {
        return $this->dia;
    }

    public function segundos(): int
    {
        return $this->segundos;
    }
}
