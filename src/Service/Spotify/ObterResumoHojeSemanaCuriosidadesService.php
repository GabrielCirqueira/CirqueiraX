<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\PeriodoMesSpotifyDTO;
use App\DataObject\Spotify\ResumoComImagensDTO;
use App\DataObject\Spotify\ResumoGeralSpotifyDTO;
use App\DataObject\Spotify\ResumoIntervaloSpotifyDTO;
use App\Entity\Usuario;
use App\Repository\ReproducaoSpotifyRepository;
use DateTimeImmutable;
use DateTimeZone;

final readonly class ObterResumoHojeSemanaCuriosidadesService
{
    public function __construct(
        private ReproducaoSpotifyRepository $reproducaoRepository,
        private EnriquecerImagensSpotifyService $enriquecerImagensService,
    ) {
    }

    public function executar(Usuario $usuario): ResumoComImagensDTO
    {
        $fusoLocal = new DateTimeZone(PeriodoMesSpotifyDTO::FUSO_HORARIO_PADRAO);
        $fusoUtc = new DateTimeZone('UTC');

        $hojeInicioLocal = new DateTimeImmutable('today 00:00:00', $fusoLocal);
        $hojeFimLocal = $hojeInicioLocal->modify('+1 day');
        $hojeInicioUtc = $hojeInicioLocal->setTimezone($fusoUtc);
        $hojeFimUtc = $hojeFimLocal->setTimezone($fusoUtc);

        $totaisHoje = $this->reproducaoRepository->calcularTotaisIntervalo($usuario, $hojeInicioUtc, $hojeFimUtc);
        $topMusicasHoje = $this->reproducaoRepository->obterRankingMusicasIntervalo(
            usuario: $usuario,
            inicioUtc: $hojeInicioUtc,
            fimUtc: $hojeFimUtc,
            limite: 50,
        );
        $topArtistasHoje = $this->reproducaoRepository->obterRankingArtistasIntervalo(
            usuario: $usuario,
            inicioUtc: $hojeInicioUtc,
            fimUtc: $hojeFimUtc,
            limite: 50,
        );

        $resumoHoje = new ResumoIntervaloSpotifyDTO(
            totalMinutos: $totaisHoje['totalMinutos'],
            totalStreams: $totaisHoje['totalStreams'],
            variacaoMinutosPercentual: null,
            topMusicas: $topMusicasHoje,
            topArtistas: $topArtistasHoje,
        );

        $agoraLocal = new DateTimeImmutable('now', $fusoLocal);
        $semanaInicioLocal = $agoraLocal->modify('-7 days');
        $semanaAnteriorInicioLocal = $semanaInicioLocal->modify('-7 days');

        $semanaFimUtc = $agoraLocal->setTimezone($fusoUtc);
        $semanaInicioUtc = $semanaInicioLocal->setTimezone($fusoUtc);
        $semanaAnteriorInicioUtc = $semanaAnteriorInicioLocal->setTimezone($fusoUtc);

        $totaisSemana = $this->reproducaoRepository->calcularTotaisIntervalo(
            usuario: $usuario,
            inicioUtc: $semanaInicioUtc,
            fimUtc: $semanaFimUtc,
        );
        $totaisSemanaAnterior = $this->reproducaoRepository->calcularTotaisIntervalo(
            usuario: $usuario,
            inicioUtc: $semanaAnteriorInicioUtc,
            fimUtc: $semanaInicioUtc,
        );

        $variacaoSemana = null;
        if ($totaisSemanaAnterior['totalMinutos'] > 0) {
            $diferenca = $totaisSemana['totalMinutos'] - $totaisSemanaAnterior['totalMinutos'];
            $variacaoSemana = (int) round(($diferenca / $totaisSemanaAnterior['totalMinutos']) * 100);
        }

        $topMusicasSemana = $this->reproducaoRepository->obterRankingMusicasIntervalo(
            usuario: $usuario,
            inicioUtc: $semanaInicioUtc,
            fimUtc: $semanaFimUtc,
            limite: 50,
        );
        $topArtistasSemana = $this->reproducaoRepository->obterRankingArtistasIntervalo(
            usuario: $usuario,
            inicioUtc: $semanaInicioUtc,
            fimUtc: $semanaFimUtc,
            limite: 50,
        );

        $resumoSemana = new ResumoIntervaloSpotifyDTO(
            totalMinutos: $totaisSemana['totalMinutos'],
            totalStreams: $totaisSemana['totalStreams'],
            variacaoMinutosPercentual: $variacaoSemana,
            topMusicas: $topMusicasSemana,
            topArtistas: $topArtistasSemana,
        );

        $periodoAtual = PeriodoMesSpotifyDTO::criarDoMesmoAnoMes(PeriodoMesSpotifyDTO::agoraCalendario());
        $periodoAnterior = $periodoAtual->mesAnterior();

        $curiosidades = $this->reproducaoRepository->obterCuriosidadesMes($usuario, $periodoAtual, $periodoAnterior);

        $resumoGeral = new ResumoGeralSpotifyDTO(
            hoje: $resumoHoje,
            semana: $resumoSemana,
            curiosidades: $curiosidades,
        );

        $faixas = [];
        foreach ($topMusicasHoje as $m) {
            $faixas[] = ['codigo' => $m->codigoFaixa(), 'nome' => $m->nomeFaixa(), 'artista' => $m->artistaPrincipal()];
        }
        foreach ($topMusicasSemana as $m) {
            $faixas[] = ['codigo' => $m->codigoFaixa(), 'nome' => $m->nomeFaixa(), 'artista' => $m->artistaPrincipal()];
        }

        $artistas = [];
        foreach ($topArtistasHoje as $a) {
            $artistas[] = ['codigo' => $a->codigoArtista(), 'nome' => $a->nomeArtista()];
        }
        foreach ($topArtistasSemana as $a) {
            $artistas[] = ['codigo' => $a->codigoArtista(), 'nome' => $a->nomeArtista()];
        }

        $mapaImagens = $this->enriquecerImagensService->enriquecerEAgendar(
            usuario: $usuario,
            faixas: $faixas,
            artistas: $artistas,
            prioridade: 1,
        );

        return new ResumoComImagensDTO($resumoGeral, $mapaImagens);
    }
}
