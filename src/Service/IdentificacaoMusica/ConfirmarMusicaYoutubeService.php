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
    private const int TAMANHO_MINIMO_COMPACTO = 5;
    private const string TIPO_FAIXA_OFICIAL = 'MUSIC_VIDEO_TYPE_ATV';
    private const string TIPO_VIDEO_OFICIAL = 'MUSIC_VIDEO_TYPE_OMV';
    private const string SUFIXO_TOPIC = '- topic';
    private const string PADRAO_PARTICIPACAO_TITULO = '/\b(?:feat\.?|ft\.?|with)\s+([^\)\]\-]+)/iu';
    private const string PADRAO_SEPARADOR_TITULO_VIDEO = '/[-–—|•:]|\bby\b/iu';

    public function __construct(
        private YoutubeMusicInterface $youtubeMusic,
        private NormalizarTextoMusicaService $normalizador,
    ) {
    }

    public function executar(ComponenteIdentificadoDTO $componente, ?int $duracaoOriginalMs, ?string $canalVideo = null): ?ItemHistoricoYoutubeMusicDTO
    {
        $artistaPrincipal = $componente->artistas[0] ?? '';
        $busca = $this->youtubeMusic->buscarMusica(trim($componente->titulo.' '.$artistaPrincipal), self::LIMITE_RESULTADOS_BUSCA);

        $oficiais = array_values(array_filter($busca->itens, $this->isCandidatoOficial(...)));
        $confirmadoOficial = $this->escolherMelhorOficial($oficiais, $componente, $duracaoOriginalMs, $canalVideo);
        if (null !== $confirmadoOficial) {
            return $confirmadoOficial;
        }

        $videosUgc = array_values(array_filter($busca->itens, fn (ItemHistoricoYoutubeMusicDTO $item): bool => !$this->isCandidatoOficial($item)));

        return $this->escolherMelhorUgc($videosUgc, $componente, $duracaoOriginalMs);
    }

    private function isCandidatoOficial(ItemHistoricoYoutubeMusicDTO $item): bool
    {
        if (self::TIPO_FAIXA_OFICIAL === $item->tipoVideo || self::TIPO_VIDEO_OFICIAL === $item->tipoVideo) {
            return true;
        }

        return str_ends_with(mb_strtolower(trim($item->textoArtistas), 'UTF-8'), self::SUFIXO_TOPIC);
    }

    /**
     * @param list<ItemHistoricoYoutubeMusicDTO> $candidatos
     */
    private function escolherMelhorOficial(
        array $candidatos,
        ComponenteIdentificadoDTO $componente,
        ?int $duracaoOriginalMs,
        ?string $canalVideo,
    ): ?ItemHistoricoYoutubeMusicDTO {
        $artistasEsperados = $this->montarArtistasEsperados($componente->artistas, $canalVideo);
        $artistaPrincipal = $componente->artistas[0] ?? '';
        $melhor = null;
        $melhorPontuacao = 0;

        foreach ($candidatos as $candidato) {
            $pontuacaoNormal = $this->pontuarPar($candidato, $componente->titulo, $artistasEsperados, $duracaoOriginalMs);
            if ($pontuacaoNormal > $melhorPontuacao) {
                $melhor = $this->ajustarCandidatoOficial($candidato, $componente->titulo);
                $melhorPontuacao = $pontuacaoNormal;
            }

            if ('' === $artistaPrincipal) {
                continue;
            }

            $pontuacaoInvertida = $this->pontuarPar($candidato, $artistaPrincipal, $this->normalizador->separarArtistas($componente->titulo), $duracaoOriginalMs);
            if ($pontuacaoInvertida > $melhorPontuacao) {
                $melhor = $this->ajustarCandidatoOficial($candidato, $artistaPrincipal);
                $melhorPontuacao = $pontuacaoInvertida;
            }
        }

        return $melhorPontuacao >= self::LIMIAR_CONFIRMACAO ? $melhor : null;
    }

    /**
     * @param list<ItemHistoricoYoutubeMusicDTO> $candidatos
     */
    private function escolherMelhorUgc(array $candidatos, ComponenteIdentificadoDTO $componente, ?int $duracaoOriginalMs): ?ItemHistoricoYoutubeMusicDTO
    {
        $artistaPrincipal = $componente->artistas[0] ?? '';
        if ('' === $artistaPrincipal || '' === trim($componente->titulo)) {
            return null;
        }

        foreach ($candidatos as $candidato) {
            $pontuacaoDireta = $this->pontuarPar($candidato, $componente->titulo, $componente->artistas, $duracaoOriginalMs);
            if ($pontuacaoDireta >= self::LIMIAR_CONFIRMACAO) {
                return $this->criarCandidatoLimpo($candidato, $componente);
            }

            if ($this->isVideoUgcExplicito($candidato, $componente->titulo, $artistaPrincipal, $duracaoOriginalMs)) {
                return $this->criarCandidatoLimpo($candidato, $componente);
            }
        }

        return null;
    }

    private function isVideoUgcExplicito(ItemHistoricoYoutubeMusicDTO $candidato, string $titulo, string $artista, ?int $duracaoOriginalMs): bool
    {
        if (0 === $this->pontuarDuracao($candidato->duracaoMs, $duracaoOriginalMs)) {
            return false;
        }

        if (1 !== preg_match(self::PADRAO_SEPARADOR_TITULO_VIDEO, $candidato->titulo)) {
            return false;
        }

        $tituloCompacto = $this->normalizador->compactarTitulo($titulo);
        $artistaCompacto = $this->normalizador->compactar($artista);
        if ('' === $tituloCompacto || '' === $artistaCompacto || $tituloCompacto === $artistaCompacto) {
            return false;
        }

        $textoCandidato = ' '.$this->normalizador->normalizar($candidato->titulo).' ';
        $tituloNorm = $this->normalizador->normalizarTitulo($titulo);
        $artistaNorm = $this->normalizador->normalizar($artista);

        $temTitulo = ('' !== $tituloNorm && str_contains($textoCandidato, ' '.$tituloNorm.' '))
            || (mb_strlen($tituloCompacto) >= self::TAMANHO_MINIMO_COMPACTO && str_contains($this->normalizador->compactar($candidato->titulo), $tituloCompacto));
        $temArtista = ('' !== $artistaNorm && str_contains($textoCandidato, ' '.$artistaNorm.' '))
            || (mb_strlen($artistaCompacto) >= self::TAMANHO_MINIMO_COMPACTO && str_contains($this->normalizador->compactar($candidato->titulo), $artistaCompacto));

        return $temTitulo && $temArtista;
    }

    private function ajustarCandidatoOficial(ItemHistoricoYoutubeMusicDTO $candidato, string $tituloEsperado): ItemHistoricoYoutubeMusicDTO
    {
        $titulo = self::TIPO_FAIXA_OFICIAL === $candidato->tipoVideo ? $candidato->titulo : $tituloEsperado;
        $artistas = implode(', ', array_map($this->normalizador->limparCanal(...), $this->normalizador->separarArtistas($candidato->textoArtistas)));

        return new ItemHistoricoYoutubeMusicDTO(
            videoId: $candidato->videoId,
            titulo: '' === trim($titulo) ? $candidato->titulo : trim($titulo),
            textoArtistas: '' === $artistas ? $candidato->textoArtistas : $artistas,
            album: $candidato->album,
            urlCapa: $candidato->urlCapa,
            duracaoMs: $candidato->duracaoMs,
            secao: $candidato->secao,
            posicao: $candidato->posicao,
            tipoVideo: $candidato->tipoVideo,
        );
    }

    private function criarCandidatoLimpo(ItemHistoricoYoutubeMusicDTO $candidato, ComponenteIdentificadoDTO $componente): ItemHistoricoYoutubeMusicDTO
    {
        return new ItemHistoricoYoutubeMusicDTO(
            videoId: $candidato->videoId,
            titulo: $componente->titulo,
            textoArtistas: implode(', ', $componente->artistas),
            album: $candidato->album,
            urlCapa: $candidato->urlCapa,
            duracaoMs: $candidato->duracaoMs,
            secao: $candidato->secao,
            posicao: $candidato->posicao,
            tipoVideo: $candidato->tipoVideo,
        );
    }

    /**
     * @param list<string> $artistas
     *
     * @return list<string>
     */
    private function montarArtistasEsperados(array $artistas, ?string $canalVideo): array
    {
        if (null === $canalVideo || '' === trim($canalVideo)) {
            return $artistas;
        }

        $canalLimpo = $this->normalizador->limparCanal($canalVideo);

        return '' === $canalLimpo ? $artistas : array_values(array_unique([...$artistas, $canalLimpo]));
    }

    /**
     * @param list<string> $artistasEsperados
     */
    private function pontuarPar(
        ItemHistoricoYoutubeMusicDTO $candidato,
        string $tituloEsperado,
        array $artistasEsperados,
        ?int $duracaoOriginalMs,
    ): int {
        $pontosArtista = $this->pontuarArtistas($candidato, $artistasEsperados);
        $pontosTitulo = $this->pontuarTitulo($candidato->titulo, $tituloEsperado);
        if (0 === $pontosArtista || 0 === $pontosTitulo) {
            return 0;
        }

        return $pontosArtista + $pontosTitulo + $this->pontuarDuracao($candidato->duracaoMs, $duracaoOriginalMs);
    }

    /**
     * @param list<string> $artistasEsperados
     */
    private function pontuarArtistas(ItemHistoricoYoutubeMusicDTO $candidato, array $artistasEsperados): int
    {
        $encontrados = array_map($this->normalizador->limparCanal(...), $this->normalizador->separarArtistas($candidato->textoArtistas));
        if (1 === preg_match(self::PADRAO_PARTICIPACAO_TITULO, $candidato->titulo, $captura)) {
            $encontrados = [...$encontrados, ...$this->normalizador->separarArtistas($captura[1])];
        }
        if ([] === $encontrados && '' !== trim($candidato->textoArtistas)) {
            $encontrados = [$this->normalizador->limparCanal($candidato->textoArtistas)];
        }

        $melhor = 0;
        foreach ($artistasEsperados as $esperado) {
            foreach ($encontrados as $encontrado) {
                $pontos = $this->pontuarTexto($encontrado, $esperado, self::PONTOS_ARTISTA_EXATO, self::PONTOS_ARTISTA_PARECIDO);
                if ($pontos > $melhor) {
                    $melhor = $pontos;
                }
            }
        }

        return $melhor;
    }

    private function pontuarTitulo(string $encontrado, string $esperado): int
    {
        $encontradoLimpo = $this->normalizador->normalizarTitulo($encontrado);
        $esperadoLimpo = $this->normalizador->normalizarTitulo($esperado);

        return $this->pontuarTexto($encontradoLimpo, $esperadoLimpo, self::PONTOS_TITULO_EXATO, self::PONTOS_TITULO_PARECIDO);
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

        $encontradoCompacto = $this->normalizador->compactar($encontradoNormalizado);
        $esperadoCompacto = $this->normalizador->compactar($esperadoNormalizado);
        if ('' !== $encontradoCompacto && $encontradoCompacto === $esperadoCompacto) {
            return $pontosExato;
        }

        if (mb_strlen($esperadoCompacto) >= self::TAMANHO_MINIMO_COMPACTO
            && mb_strlen($encontradoCompacto) >= self::TAMANHO_MINIMO_COMPACTO
            && (str_contains($encontradoCompacto, $esperadoCompacto) || str_contains($esperadoCompacto, $encontradoCompacto))) {
            return $pontosExato;
        }

        similar_text($encontradoNormalizado, $esperadoNormalizado, $porcentagem);
        if ($porcentagem >= self::SIMILARIDADE_MINIMA) {
            return $pontosParecido;
        }

        similar_text($encontradoCompacto, $esperadoCompacto, $porcentagemCompacta);

        return $porcentagemCompacta >= self::SIMILARIDADE_MINIMA ? $pontosParecido : 0;
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
