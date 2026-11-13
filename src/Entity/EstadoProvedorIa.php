<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\ProvedorIa;
use App\Repository\EstadoProvedorIaRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: EstadoProvedorIaRepository::class)]
#[ORM\Table(name: 'estado_provedor_ia')]
#[ORM\UniqueConstraint(name: 'UNIQ_ESTADO_PROVEDOR_IA_PROVEDOR', columns: ['provedor'])]
class EstadoProvedorIa
{
    private const int ESPERA_INICIAL_LIMITE_SEGUNDOS = 60;
    private const int ESPERA_MAXIMA_LIMITE_SEGUNDOS = 21600;
    private const int BLOQUEIO_ACESSO_NEGADO_SEGUNDOS = 86400;
    private const int FALHAS_SEGUIDAS_PARA_PAUSA = 3;
    private const int PAUSA_APOS_FALHAS_SEGUNDOS = 900;
    private const int TAMANHO_MAXIMO_MOTIVO = 255;
    private const int BASE_ESPERA_PROGRESSIVA = 2;
    private const int EXPOENTE_MAXIMO_ESPERA = 10;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\Column(type: 'string', length: 30, enumType: ProvedorIa::class)]
    private ProvedorIa $provedor;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $bloqueadoAte = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $motivoBloqueio = null;

    #[ORM\Column(type: 'integer')]
    private int $limitesSeguidos = 0;

    #[ORM\Column(type: 'integer')]
    private int $falhasSeguidas = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalSucessos = 0;

    #[ORM\Column(type: 'integer')]
    private int $totalFalhas = 0;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $ultimoSucessoEm = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $ultimaFalhaEm = null;

    public function __construct(ProvedorIa $provedor)
    {
        $this->uuid = Uuid::v7();
        $this->provedor = $provedor;
    }

    public function isDisponivel(DateTimeImmutable $agora): bool
    {
        return null === $this->bloqueadoAte || $this->bloqueadoAte <= $agora;
    }

    public function registrarSucesso(DateTimeImmutable $agora): self
    {
        $this->limitesSeguidos = 0;
        $this->falhasSeguidas = 0;
        ++$this->totalSucessos;
        $this->ultimoSucessoEm = $agora;

        return $this->desbloquear();
    }

    public function registrarLimiteAtingido(?int $esperaInformadaSegundos, string $motivo, DateTimeImmutable $agora): self
    {
        $esperaProgressiva = self::ESPERA_INICIAL_LIMITE_SEGUNDOS * self::BASE_ESPERA_PROGRESSIVA ** min($this->limitesSeguidos, self::EXPOENTE_MAXIMO_ESPERA);
        $espera = min(self::ESPERA_MAXIMA_LIMITE_SEGUNDOS, $esperaInformadaSegundos ?? $esperaProgressiva);
        ++$this->limitesSeguidos;

        return $this->registrarFalhaComBloqueio($espera, $motivo, $agora);
    }

    public function registrarAcessoNegado(string $motivo, DateTimeImmutable $agora): self
    {
        return $this->registrarFalhaComBloqueio(self::BLOQUEIO_ACESSO_NEGADO_SEGUNDOS, $motivo, $agora);
    }

    public function registrarFalha(string $motivo, DateTimeImmutable $agora): self
    {
        ++$this->falhasSeguidas;
        if ($this->falhasSeguidas < self::FALHAS_SEGUIDAS_PARA_PAUSA) {
            ++$this->totalFalhas;
            $this->ultimaFalhaEm = $agora;

            return $this;
        }

        $this->falhasSeguidas = 0;

        return $this->registrarFalhaComBloqueio(self::PAUSA_APOS_FALHAS_SEGUNDOS, $motivo, $agora);
    }

    public function desbloquear(): self
    {
        $this->bloqueadoAte = null;
        $this->motivoBloqueio = null;

        return $this;
    }

    private function registrarFalhaComBloqueio(int $segundos, string $motivo, DateTimeImmutable $agora): self
    {
        ++$this->totalFalhas;
        $this->ultimaFalhaEm = $agora;
        $this->bloqueadoAte = $agora->modify(sprintf('+%d seconds', $segundos));
        $this->motivoBloqueio = mb_substr($motivo, 0, self::TAMANHO_MAXIMO_MOTIVO);

        return $this;
    }

    public function uuid(): Uuid
    {
        return $this->uuid;
    }

    public function provedor(): ProvedorIa
    {
        return $this->provedor;
    }

    public function bloqueadoAte(): ?DateTimeImmutable
    {
        return $this->bloqueadoAte;
    }

    public function motivoBloqueio(): ?string
    {
        return $this->motivoBloqueio;
    }

    public function totalSucessos(): int
    {
        return $this->totalSucessos;
    }

    public function totalFalhas(): int
    {
        return $this->totalFalhas;
    }

    public function ultimoSucessoEm(): ?DateTimeImmutable
    {
        return $this->ultimoSucessoEm;
    }

    public function ultimaFalhaEm(): ?DateTimeImmutable
    {
        return $this->ultimaFalhaEm;
    }
}
