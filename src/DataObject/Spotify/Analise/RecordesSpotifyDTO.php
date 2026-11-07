<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

final readonly class RecordesSpotifyDTO
{
    /**
     * @param array{minutos: int, streams: int, reproducoes: int, artistas: int, faixas: int, dias: int, primeira: ?string, ultima: ?string} $totais
     * @param array{data: string, minutos: int}|null $diaRecorde
     * @param array{ano: int, mes: int, streams: int, minutos: int}|null $mesRecorde
     */
    public function __construct(
        public array $totais,
        public SequenciasSpotifyDTO $sequencias,
        public ?array $diaRecorde,
        public ?array $mesRecorde,
        public ?MusicaAnaliseSpotifyDTO $musicaMaisOuvida,
        public ?ArtistaAnaliseSpotifyDTO $artistaMaisHoras,
        public ?RepeticaoDiariaSpotifyDTO $maiorRepeticaoDiaria,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return [
            'totais' => [
                'minutos' => $this->totais['minutos'],
                'streams' => $this->totais['streams'],
                'artistas' => $this->totais['artistas'],
                'faixas' => $this->totais['faixas'],
                'dias' => $this->totais['dias'],
                'desde' => PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($this->totais['primeira']),
            ],
            'sequencias' => $this->sequencias->paraArray(),
            'diaRecorde' => $this->diaRecorde,
            'mesRecorde' => $this->mesRecorde,
            'musicaMaisOuvida' => $this->musicaMaisOuvida?->paraArray(),
            'artistaMaisHoras' => $this->artistaMaisHoras?->paraArray(),
            'maiorRepeticaoDiaria' => $this->maiorRepeticaoDiaria?->paraArray(),
        ];
    }
}
