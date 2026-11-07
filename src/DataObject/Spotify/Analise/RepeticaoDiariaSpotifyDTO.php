<?php

declare(strict_types=1);

namespace App\DataObject\Spotify\Analise;

final readonly class RepeticaoDiariaSpotifyDTO
{
    public function __construct(
        public MusicaAnaliseSpotifyDTO $musica,
        public int $vezes,
        public string $data,
    ) {}

    /**
     * @param array{musica: MusicaAnaliseSpotifyDTO, vezes: int, data: string}|null $dados
     */
    public static function deArray(?array $dados): ?self
    {
        return null === $dados ? null : new self($dados['musica'], $dados['vezes'], $dados['data']);
    }

    /**
     * @return array<string, mixed>
     */
    public function paraArray(): array
    {
        return ['musica' => $this->musica->paraArray(), 'vezes' => $this->vezes, 'data' => $this->data];
    }
}
