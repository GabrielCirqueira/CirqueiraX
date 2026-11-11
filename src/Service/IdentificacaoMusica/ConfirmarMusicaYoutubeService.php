<?php

declare(strict_types=1);

namespace App\Service\IdentificacaoMusica;

use App\DataObject\IdentificacaoMusica\ComponenteIdentificadoDTO;
use App\DataObject\YoutubeMusic\ItemHistoricoYoutubeMusicDTO;
use App\Interface\YoutubeMusicInterface;
use App\Service\Musica\NormalizarTextoMusicaService;

final readonly class ConfirmarMusicaYoutubeService
{
    public const int LIMIAR_CONFIRMACAO = 70;
    private const int LIMITE_RESULTADOS_BUSCA = 5;
    private const int PONTOS_ARTISTA_EXATO = 50;
    private const int PONTOS_ARTISTA_PARECIDO = 35;
    private const int PONTOS_TITULO_EXATO = 30;
    private const int PONTOS_TITULO_PARECIDO = 20;
    private const int PONTOS_DURACAO_PROXIMA = 20;
    private const int PONTOS_DURACAO_ACEITAVEL = 10;
    private const int PONTOS_SEM_DURACAO = 10;
    private const int SIMILARIDADE_MINIMA = 75;
    private const int TOLERANCIA_PROXIMA_MS = 15000;
    private const int TOLERANCIA_ACEITAVEL_MS = 30000;

    public function __construct(
        private YoutubeMusicInterface $youtubeMusic,
        private NormalizarTextoMusicaService $normalizador,
    ) {
    }

    public function executar(ComponenteIdentificadoDTO $componente, ?int $duracaoOriginalMs): ?ItemHistoricoYoutubeMusicDTO
    {
        $artistaPrincipal = $componente->artistas[0] ?? '';
        $busca = $this->youtubeMusic->buscarMusica(trim($componente->titulo.' '.$artistaPrincipal), self::LIMITE_RESULTADOS_BUSCA);

        $melhor = null;
        $melhorPontuacao = 0;
        foreach ($busca->itens as $candidato) {
            $pontuacao = $this->pontuar($candidato, $componente->titulo, $artistaPrincipal, $duracaoOriginalMs);
            if ($pontuacao > $melhorPontuacao) {
                $melhor = $candidato;
                $melhorPontuacao = $pontuacao;
            }
        }

        return $melhorPontuacao >= self::LIMIAR_CONFIRMACAO ? $melhor : null;
    }

    private function pontuar(ItemHistoricoYoutubeMusicDTO $candidato, string $titulo, string $artista, ?int $duracaoOriginalMs): int
    {
        return $this->pontuarTexto($candidato->textoArtistas, $artista, self::PONTOS_ARTISTA_EXATO, self::PONTOS_ARTISTA_PARECIDO)
            + $this->pontuarTexto($candidato->titulo, $titulo, self::PONTOS_TITULO_EXATO, self::PONTOS_TITULO_PARECIDO)
            + $this->pontuarDuracao($candidato->duracaoMs, $duracaoOriginalMs);
    }

    private function pontuarTexto(string $encontrado, string $esperado, int $pontosExato, int $pontosParecido): int
    {
        $encontradoNormalizado = $this->normalizador->normalizar($encontrado);
        $esperadoNormalizado = $this->normalizador->normalizar($esperado);
        if ('' === $encontradoNormalizado || '' === $esperadoNormalizado) {
            return 0;
        }

        if (str_contains($encontradoNormalizado, $esperadoNormalizado) || str_contains($esperadoNormalizado, $encontradoNormalizado)) {
            return $pontosExato;
        }

        similar_text($encontradoNormalizado, $esperadoNormalizado, $porcentagem);

        return $porcentagem >= self::SIMILARIDADE_MINIMA ? $pontosParecido : 0;
    }

    private function pontuarDuracao(?int $duracaoCandidatoMs, ?int $duracaoOriginalMs): int
    {
        if (null === $duracaoCandidatoMs || null === $duracaoOriginalMs || $duracaoOriginalMs <= 0) {
            return self::PONTOS_SEM_DURACAO;
        }

        $diferenca = abs($duracaoCandidatoMs - $duracaoOriginalMs);
        if ($diferenca <= self::TOLERANCIA_PROXIMA_MS) {
            return self::PONTOS_DURACAO_PROXIMA;
        }

        return $diferenca <= self::TOLERANCIA_ACEITAVEL_MS ? self::PONTOS_DURACAO_ACEITAVEL : 0;
    }
}
