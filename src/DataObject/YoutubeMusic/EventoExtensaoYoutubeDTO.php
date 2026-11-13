<?php

declare(strict_types=1);

namespace App\DataObject\YoutubeMusic;

use App\Enum\TipoEventoExtensaoYoutube;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class EventoExtensaoYoutubeDTO
{
    public const int MAXIMO_MS = 86400000;
    public const int MAXIMO_SEGUNDOS_DESDE_INICIO = 604800;

    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Regex(pattern: '/^[A-Za-z0-9-]{8,64}$/', message: 'Identificador da reprodução inválido.')]
        public string $idReproducao,
        #[Assert\NotBlank]
        #[Assert\Choice(callback: [self::class, 'tiposAceitos'], message: 'Tipo de evento inválido.')]
        public string $tipo,
        #[Assert\NotBlank]
        #[Assert\Regex(pattern: '/^[A-Za-z0-9_-]{11}$/', message: 'videoId inválido.')]
        public string $videoId,
        #[Assert\NotBlank]
        #[Assert\Length(max: 300)]
        public string $titulo,
        #[Assert\Length(max: 300)]
        public string $canal = '',
        #[Assert\Length(max: 500)]
        #[Assert\Regex(pattern: '#^https://(lh3\.googleusercontent\.com|yt3\.googleusercontent\.com|yt3\.ggpht\.com|i\.ytimg\.com)/#', message: 'Capa inválida.')]
        public ?string $urlCapa = null,
        #[Assert\Range(min: 0, max: self::MAXIMO_MS)]
        public ?int $duracaoMs = null,
        #[Assert\Range(min: 0, max: self::MAXIMO_MS)]
        public int $msOuvidos = 0,
        #[Assert\Range(min: 0, max: self::MAXIMO_SEGUNDOS_DESDE_INICIO)]
        public int $segundosDesdeInicio = 0,
        public ?bool $pulada = null,
        public ?bool $pausada = null,
    ) {
    }

    /**
     * @return list<string>
     */
    public static function tiposAceitos(): array
    {
        return array_map(static fn (TipoEventoExtensaoYoutube $tipo): string => $tipo->value, TipoEventoExtensaoYoutube::cases());
    }

    public function tipoEvento(): TipoEventoExtensaoYoutube
    {
        return TipoEventoExtensaoYoutube::from($this->tipo);
    }

    public function isPausada(): bool
    {
        return true === $this->pausada && !$this->tipoEvento()->isFim();
    }

    public function puladaInformada(): ?bool
    {
        if (!$this->tipoEvento()->isFim()) {
            return null;
        }

        return true === $this->pulada;
    }
}
