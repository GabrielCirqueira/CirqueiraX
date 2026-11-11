<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\CuriosidadesSpotifyDTO;
use App\DataObject\Spotify\PeriodoMesSpotifyDTO;
use App\DataObject\Spotify\ResumoComImagensDTO;
use App\DataObject\Spotify\ResumoGeralSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Service\Spotify\EnriquecerImagensSpotifyService;

final readonly class ObterResumoHojeSemanaCuriosidadesService
{
    private const int LIMITE_TOPO = 50;
    private const int DIAS_SEMANA = 7;
    private const int PRIORIDADE_IMAGENS = 1;
    private const int PERCENTUAL = 100;
    private const string ROTULO_HOJE = 'Hoje';
    private const string ROTULO_SEMANA = 'Últimos 7 dias';

    public function __construct(
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private MontarResumoIntervaloMusicaService $montarResumoService,
        private EnriquecerImagensSpotifyService $enriquecerImagensService,
    ) {}

    public function executar(Usuario $usuario, FiltroFonteMusica $fonte): ResumoComImagensDTO
    {
        $hojeInicio = PeriodoAnaliseSpotifyDTO::agoraLocal()->setTime(0, 0);
        $agora = PeriodoAnaliseSpotifyDTO::agoraLocal();
        $semanaInicio = $agora->modify(sprintf('-%d days', self::DIAS_SEMANA));

        $hoje = $this->montarResumoService->montar(
            $usuario,
            $fonte,
            PeriodoAnaliseSpotifyDTO::entre($hojeInicio, $hojeInicio->modify('+1 day'), self::ROTULO_HOJE),
            null,
            self::LIMITE_TOPO,
        );
        $semana = $this->montarResumoService->montar(
            $usuario,
            $fonte,
            PeriodoAnaliseSpotifyDTO::entre($semanaInicio, $agora, self::ROTULO_SEMANA),
            PeriodoAnaliseSpotifyDTO::entre($semanaInicio->modify(sprintf('-%d days', self::DIAS_SEMANA)), $semanaInicio, self::ROTULO_SEMANA),
            self::LIMITE_TOPO,
        );

        $mapaImagens = $this->enriquecerImagensService->enriquecerEAgendar(
            usuario: $usuario,
            faixas: [...$this->montarResumoService->listarFaixasParaImagens($hoje), ...$this->montarResumoService->listarFaixasParaImagens($semana)],
            artistas: [...$this->montarResumoService->listarArtistasParaImagens($hoje), ...$this->montarResumoService->listarArtistasParaImagens($semana)],
            prioridade: self::PRIORIDADE_IMAGENS,
        );

        return new ResumoComImagensDTO(
            new ResumoGeralSpotifyDTO(hoje: $hoje, semana: $semana, curiosidades: $this->montarCuriosidades($usuario, $fonte)),
            $mapaImagens,
        );
    }

    private function montarCuriosidades(Usuario $usuario, FiltroFonteMusica $fonte): CuriosidadesSpotifyDTO
    {
        $mesAtual = PeriodoMesSpotifyDTO::criarDoMesmoAnoMes(PeriodoMesSpotifyDTO::agoraCalendario());
        $mesAnterior = $mesAtual->mesAnterior();
        $periodo = PeriodoAnaliseSpotifyDTO::doMes($mesAtual->ano(), $mesAtual->mes());
        $picos = $this->analiseRepository->calcularPicosDoPeriodo($usuario, $periodo, $fonte);
        $repeticao = $this->analiseRepository->buscarMaiorRepeticaoDiaria($usuario, $periodo, $fonte);

        $diasDecorridos = $mesAtual->isMesCorrente()
            ? max(1, (int) PeriodoMesSpotifyDTO::agoraCalendario()->format('j'))
            : (int) $mesAtual->inicioUtc()->format('t');
        $mediaDiaria = (int) round($this->analiseRepository->calcularTotais($usuario, $periodo, $fonte)['minutos'] / $diasDecorridos);
        $minutosAnterior = $this->analiseRepository->calcularTotais(
            $usuario,
            PeriodoAnaliseSpotifyDTO::doMes($mesAnterior->ano(), $mesAnterior->mes()),
            $fonte,
        )['minutos'];
        $mediaAnterior = (int) round($minutosAnterior / max(1, (int) $mesAnterior->inicioUtc()->format('t')));

        return new CuriosidadesSpotifyDTO(
            horarioPico: $picos['horarioPico'],
            minutosHorarioPico: $picos['minutosHorarioPico'],
            diaSemanaMaisOuvido: $picos['diaSemana'],
            minutosDiaSemana: $picos['minutosDiaSemana'],
            diaMaisLongoData: $picos['diaMaisLongo'],
            diaMaisLongoMinutos: $picos['minutosDiaMaisLongo'],
            faixaMaisRepetidaNome: $repeticao['musica']->nomeFaixa ?? null,
            faixaMaisRepetidaArtista: $repeticao['musica']->artista ?? null,
            faixaMaisRepetidaVezes: $repeticao['vezes'] ?? 0,
            faixaMaisRepetidaData: $repeticao['data'] ?? null,
            artistasDescobertosNoMes: $this->analiseRepository->contarArtistasNovos($usuario, $periodo, $fonte),
            mediaMinutosDiarios: $mediaDiaria,
            variacaoMediaDiariaPercentual: $mediaAnterior > 0 ? (int) round((($mediaDiaria - $mediaAnterior) / $mediaAnterior) * self::PERCENTUAL) : null,
        );
    }
}
