<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\CapsulaMensalSpotifyDTO;
use App\DataObject\Spotify\ItemRankingArtistaCapsulaDTO;
use App\DataObject\Spotify\ItemRankingMusicaCapsulaDTO;
use App\DataObject\Spotify\PeriodoMesSpotifyDTO;
use App\Entity\Usuario;
use App\Repository\ReproducaoSpotifyRepository;

final readonly class CalcularCapsulaMensalService
{
    private const int LIMITE_TOP_MUSICAS = 5;
    private const int LIMITE_TOP_ARTISTAS = 10;
    private const int MESES_RETROATIVOS_TOP5 = 6;

    public function __construct(
        private ReproducaoSpotifyRepository $reproducaoRepository,
    ) {}

    public function executar(Usuario $usuario, int $ano, int $mes): CapsulaMensalSpotifyDTO
    {
        $periodo = PeriodoMesSpotifyDTO::criar($ano, $mes);
        $periodoAnterior = $periodo->mesAnterior();

        $totaisMes = $this->reproducaoRepository->calcularTotaisMes($usuario, $periodo);
        $totaisMesAnterior = $this->reproducaoRepository->calcularTotaisMes($usuario, $periodoAnterior);

        $variacaoFaixasPercentual = null;
        if ($totaisMesAnterior->faixasDistintas() > 0) {
            $diferenca = $totaisMes->faixasDistintas() - $totaisMesAnterior->faixasDistintas();
            $variacaoFaixasPercentual = (int) round(($diferenca / $totaisMesAnterior->faixasDistintas()) * 100);
        }

        $rankingMusicas = $this->reproducaoRepository->obterRankingMusicasMes(
            usuario: $usuario,
            periodo: $periodo,
            limite: self::LIMITE_TOP_MUSICAS,
        );

        $rankingMusicasAnterior = $this->reproducaoRepository->obterRankingMusicasMes(
            usuario: $usuario,
            periodo: $periodoAnterior,
            limite: 50,
        );

        /** @var array<string, int> $posicoesMusicasAnterior */
        $posicoesMusicasAnterior = [];
        foreach ($rankingMusicasAnterior as $indice => $item) {
            $posicoesMusicasAnterior[$item->chaveIdentificacao()] = $indice + 1;
        }

        /** @var array<string, int> $historicoTop5Meses */
        $historicoTop5Meses = $this->calcularMesesNoTop5($usuario, $periodo, $rankingMusicas);

        $topMusicasCapsula = [];
        foreach ($rankingMusicas as $indice => $musica) {
            $posicaoAtual = $indice + 1;
            $chave = $musica->chaveIdentificacao();
            $posicaoAnterior = $posicoesMusicasAnterior[$chave] ?? null;

            $isEstreia = null === $posicaoAnterior;
            $movimento = null !== $posicaoAnterior ? ($posicaoAnterior - $posicaoAtual) : null;
            $mesesNoTop5 = $historicoTop5Meses[$chave] ?? 1;

            $topMusicasCapsula[] = new ItemRankingMusicaCapsulaDTO(
                posicao: $posicaoAtual,
                codigoFaixa: $musica->codigoFaixa(),
                nomeFaixa: $musica->nomeFaixa(),
                artistaPrincipal: $musica->artistaPrincipal(),
                album: $musica->album(),
                totalStreams: $musica->totalStreams(),
                totalMinutos: $musica->totalMinutos(),
                movimento: $movimento,
                isEstreia: $isEstreia,
                mesesNoTop5: $mesesNoTop5,
            );
        }

        $rankingArtistas = $this->reproducaoRepository->obterRankingArtistasMes(
            usuario: $usuario,
            periodo: $periodo,
            limite: self::LIMITE_TOP_ARTISTAS,
        );

        $rankingArtistasAnterior = $this->reproducaoRepository->obterRankingArtistasMes(
            usuario: $usuario,
            periodo: $periodoAnterior,
            limite: 50,
        );

        /** @var array<string, int> $posicoesArtistasAnterior */
        $posicoesArtistasAnterior = [];
        foreach ($rankingArtistasAnterior as $indice => $item) {
            $posicoesArtistasAnterior[mb_strtolower($item->nomeArtista())] = $indice + 1;
        }

        $topArtistasCapsula = [];
        foreach ($rankingArtistas as $indice => $artista) {
            $posicaoAtual = $indice + 1;
            $chaveArtista = mb_strtolower($artista->nomeArtista());
            $posicaoAnterior = $posicoesArtistasAnterior[$chaveArtista] ?? null;

            $isEstreia = null === $posicaoAnterior;
            $movimento = null !== $posicaoAnterior ? ($posicaoAnterior - $posicaoAtual) : null;

            $topArtistasCapsula[] = new ItemRankingArtistaCapsulaDTO(
                posicao: $posicaoAtual,
                nomeArtista: $artista->nomeArtista(),
                codigoArtista: $artista->codigoArtista(),
                totalStreams: $artista->totalStreams(),
                totalMinutos: $artista->totalMinutos(),
                movimento: $movimento,
                isEstreia: $isEstreia,
            );
        }

        $minutosPorDia = $this->reproducaoRepository->calcularMinutosPorDia($usuario, $periodo);

        $musicaMaisOuvida = $topMusicasCapsula[0] ?? null;
        $artistaMaisOuvido = $topArtistasCapsula[0] ?? null;

        $mesesNomes = [
            1 => 'Janeiro', 2 => 'Fevereiro', 3 => 'Março', 4 => 'Abril',
            5 => 'Maio', 6 => 'Junho', 7 => 'Julho', 8 => 'Agosto',
            9 => 'Setembro', 10 => 'Outubro', 11 => 'Novembro', 12 => 'Dezembro',
        ];
        $rotulo = sprintf('%s de %d', $mesesNomes[$mes] ?? (string) $mes, $ano);

        return new CapsulaMensalSpotifyDTO(
            ano: $ano,
            mes: $mes,
            rotulo: $rotulo,
            emAndamento: $periodo->isMesCorrente(),
            calculadoEm: new \DateTimeImmutable(),
            totalMinutos: $totaisMes->totalMinutos(),
            totalStreams: $totaisMes->totalStreams(),
            faixasDistintas: $totaisMes->faixasDistintas(),
            variacaoFaixasDistintasPercentual: $variacaoFaixasPercentual,
            musicaMaisOuvida: $musicaMaisOuvida,
            artistaMaisOuvido: $artistaMaisOuvido,
            topMusicas: $topMusicasCapsula,
            topArtistas: $topArtistasCapsula,
            minutosPorDia: $minutosPorDia,
        );
    }

    /**
     * @param array<int, \App\DataObject\Spotify\ItemRankingMusicaDTO> $topMusicas
     * @return array<string, int>
     */
    private function calcularMesesNoTop5(
        Usuario $usuario,
        PeriodoMesSpotifyDTO $periodoAtual,
        array $topMusicas,
    ): array {
        /** @var array<string, int> $contagem */
        $contagem = [];

        foreach ($topMusicas as $m) {
            $contagem[$m->chaveIdentificacao()] = 1;
        }

        if (empty($contagem)) {
            return [];
        }

        $periodoCursor = $periodoAtual->mesAnterior();

        for ($passo = 1; $passo <= self::MESES_RETROATIVOS_TOP5; $passo++) {
            $rankingMes = $this->reproducaoRepository->obterRankingMusicasMes(
                usuario: $usuario,
                periodo: $periodoCursor,
                limite: self::LIMITE_TOP_MUSICAS,
            );

            /** @var array<string, true> $noTop5DesteMes */
            $noTop5DesteMes = [];
            foreach ($rankingMes as $item) {
                $noTop5DesteMes[$item->chaveIdentificacao()] = true;
            }

            $algumaPermaneceu = false;
            foreach ($topMusicas as $m) {
                $chave = $m->chaveIdentificacao();
                if (isset($noTop5DesteMes[$chave]) && $contagem[$chave] === $passo) {
                    $contagem[$chave]++;
                    $algumaPermaneceu = true;
                }
            }

            if (!$algumaPermaneceu) {
                break;
            }

            $periodoCursor = $periodoCursor->mesAnterior();
        }

        return $contagem;
    }
}

