<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

use App\DataObject\Spotify\PeriodoMesSpotifyDTO;
use App\Enum\TipoPeriodoAnaliseSpotify;
use DateTimeImmutable;
use DateTimeZone;
use Symfony\Component\HttpFoundation\Request;

final readonly class PeriodoAnaliseSpotifyDTO
{
    public const array NOMES_MESES = [
        1 => 'Janeiro',
        2 => 'Fevereiro',
        3 => 'Março',
        4 => 'Abril',
        5 => 'Maio',
        6 => 'Junho',
        7 => 'Julho',
        8 => 'Agosto',
        9 => 'Setembro',
        10 => 'Outubro',
        11 => 'Novembro',
        12 => 'Dezembro',
    ];

    private const int DIAS_PADRAO = 30;
    private const int DIAS_MAXIMO = 3650;
    private const string FORMATO_SQL = 'Y-m-d H:i:s';

    public function __construct(
        public TipoPeriodoAnaliseSpotify $tipo,
        public ?DateTimeImmutable $inicioLocal,
        public ?DateTimeImmutable $fimLocal,
        public string $rotulo,
    ) {}

    public static function fromRequest(Request $request): self
    {
        $tipo = TipoPeriodoAnaliseSpotify::tryFrom((string) $request->query->get('periodo', 'dias'))
            ?? TipoPeriodoAnaliseSpotify::Dias;
        $agora = self::agoraLocal();
        $ano = $request->query->getInt('ano', (int) $agora->format('Y'));
        $mes = $request->query->getInt('mes', (int) $agora->format('n'));

        return match ($tipo) {
            TipoPeriodoAnaliseSpotify::Todos => self::todos(),
            TipoPeriodoAnaliseSpotify::Ano => self::doAno($ano),
            TipoPeriodoAnaliseSpotify::Mes => self::doMes($ano, $mes),
            default => self::ultimosDias($request->query->getInt('dias', self::DIAS_PADRAO)),
        };
    }

    public static function todos(): self
    {
        return new self(TipoPeriodoAnaliseSpotify::Todos, null, null, 'Desde sempre');
    }

    public static function doAno(int $ano): self
    {
        $inicio = new DateTimeImmutable(sprintf('%04d-01-01 00:00:00', $ano), self::fuso());

        return new self(TipoPeriodoAnaliseSpotify::Ano, $inicio, $inicio->modify('+1 year'), sprintf('Ano de %d', $ano));
    }

    public static function doMes(int $ano, int $mes): self
    {
        $mesValido = max(1, min(12, $mes));
        $inicio = new DateTimeImmutable(sprintf('%04d-%02d-01 00:00:00', $ano, $mesValido), self::fuso());

        return new self(
            TipoPeriodoAnaliseSpotify::Mes,
            $inicio,
            $inicio->modify('+1 month'),
            sprintf('%s de %d', self::NOMES_MESES[$mesValido], $ano),
        );
    }

    public static function ultimosDias(int $dias): self
    {
        $diasValidos = max(1, min(self::DIAS_MAXIMO, $dias));
        $amanha = self::agoraLocal()->setTime(0, 0)->modify('+1 day');

        return new self(
            TipoPeriodoAnaliseSpotify::Dias,
            $amanha->modify(sprintf('-%d days', $diasValidos)),
            $amanha,
            1 === $diasValidos ? 'Hoje' : sprintf('Últimos %d dias', $diasValidos),
        );
    }

    public static function entre(DateTimeImmutable $inicioLocal, DateTimeImmutable $fimLocal, string $rotulo): self
    {
        return new self(TipoPeriodoAnaliseSpotify::Intervalo, $inicioLocal, $fimLocal, $rotulo);
    }

    public static function agoraLocal(): DateTimeImmutable
    {
        return new DateTimeImmutable('now', self::fuso());
    }

    public static function fuso(): DateTimeZone
    {
        return new DateTimeZone(PeriodoMesSpotifyDTO::FUSO_HORARIO_PADRAO);
    }

    public static function utcParaIsoLocal(?string $dataUtc): ?string
    {
        if (null === $dataUtc || '' === $dataUtc) {
            return null;
        }

        return (new DateTimeImmutable($dataUtc, new DateTimeZone('UTC')))->setTimezone(self::fuso())->format(DATE_ATOM);
    }

    public function chaveCache(): string
    {
        return sprintf('%s|%s|%s', $this->tipo->value, $this->inicioUtcSql() ?? '-', $this->fimUtcSql() ?? '-');
    }

    public function isTodos(): bool
    {
        return $this->tipo->isTodos() || null === $this->inicioLocal || null === $this->fimLocal;
    }

    public function inicioUtcSql(): ?string
    {
        return $this->inicioLocal?->setTimezone(new DateTimeZone('UTC'))->format(self::FORMATO_SQL);
    }

    public function fimUtcSql(): ?string
    {
        return $this->fimLocal?->setTimezone(new DateTimeZone('UTC'))->format(self::FORMATO_SQL);
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'tipo' => $this->tipo->value,
            'rotulo' => $this->rotulo,
            'inicio' => $this->inicioLocal?->format('Y-m-d'),
            'fim' => $this->fimLocal?->modify('-1 second')->format('Y-m-d'),
        ];
    }
}
