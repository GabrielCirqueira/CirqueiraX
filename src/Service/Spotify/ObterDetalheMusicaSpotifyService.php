<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\ComportamentoReproducaoSpotifyDTO;
use App\DataObject\Spotify\Analise\DetalheMusicaSpotifyDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\RepeticaoDiariaSpotifyDTO;
use App\Entity\Usuario;
use App\Exception\Spotify\SpotifyException;
use App\Repository\AnaliseReproducaoSpotifyRepository;

final readonly class ObterDetalheMusicaSpotifyService
{
    private const int LIMITE_OUTRAS = 6;
    private const int TAMANHO_TOPO = 5;

    public function __construct(
        private CacheAnaliseSpotifyService $cacheAnalise,
        private AnaliseReproducaoSpotifyRepository $analiseRepository,
        private AplicarImagensAnaliseSpotifyService $aplicarImagensService,
    ) {}

    public function executar(Usuario $usuario, string $nomeFaixa, string $nomeArtista): DetalheMusicaSpotifyDTO
    {
        return $this->cacheAnalise->lembrar($usuario, 'musica|' . mb_strtolower($nomeFaixa . '|' . $nomeArtista), fn (): DetalheMusicaSpotifyDTO => $this->calcular($usuario, $nomeFaixa, $nomeArtista));
    }

    private function calcular(Usuario $usuario, string $nomeFaixa, string $nomeArtista): DetalheMusicaSpotifyDTO
    {
        $resumo = $this->analiseRepository->buscarResumoAlvo($usuario, $nomeArtista, $nomeFaixa);
        if (null === $resumo) {
            throw SpotifyException::musicaSemReproducoes($nomeFaixa);
        }

        $todos = PeriodoAnaliseSpotifyDTO::todos();
        $musica = new MusicaAnaliseSpotifyDTO(
            (string) $resumo['nome_faixa'],
            $resumo['artista'],
            $resumo['codigo_faixa'],
            $resumo['album'] ?? 'Desconhecido',
            $resumo['streams'],
            (int) round($resumo['ms'] / 60000),
        );
        $resumoArtista = $this->analiseRepository->buscarResumoAlvo($usuario, $nomeArtista, null);
        $artista = new ArtistaAnaliseSpotifyDTO(
            $resumo['artista'],
            $resumoArtista['codigo_artista'] ?? null,
            $resumoArtista['streams'] ?? 0,
            (int) round(($resumoArtista['ms'] ?? 0) / 60000),
        );
        $outras = array_values(array_filter(
            $this->analiseRepository->listarRankingMusicas($usuario, $todos, self::LIMITE_OUTRAS + 1, $nomeArtista),
            static fn (MusicaAnaliseSpotifyDTO $item): bool => mb_strtolower(trim($item->nomeFaixa)) !== mb_strtolower(trim($nomeFaixa)),
        ));
        $outras = array_slice($outras, 0, self::LIMITE_OUTRAS);
        $mapa = $this->aplicarImagensService->mapear($usuario, [$musica, ...$outras], [$artista]);

        return new DetalheMusicaSpotifyDTO(
            musica: $musica->comImagem($mapa),
            artista: $artista->comImagem($mapa),
            reproducoes: $resumo['reproducoes'],
            diasOuvidos: $resumo['dias'],
            primeiraVezEm: PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($resumo['primeira']),
            ultimaVezEm: PeriodoAnaliseSpotifyDTO::utcParaIsoLocal($resumo['ultima']),
            posicaoGeral: $this->analiseRepository->buscarPosicaoGeral($usuario, $nomeArtista, $nomeFaixa),
            duracaoMs: $resumo['duracao_ms'],
            evolucao: $this->analiseRepository->calcularEvolucaoMensal($usuario, $todos, $nomeArtista, $nomeFaixa),
            mesesNoTopo: $this->analiseRepository->listarMesesNoTopo($usuario, $nomeArtista, $nomeFaixa, self::TAMANHO_TOPO),
            recordeDiario: RepeticaoDiariaSpotifyDTO::deArray(
                $this->analiseRepository->buscarMaiorRepeticaoDiaria($usuario, $todos, $nomeArtista, $nomeFaixa),
            ),
            comportamento: ComportamentoReproducaoSpotifyDTO::deArray(
                $this->analiseRepository->calcularComportamento($usuario, $todos, $nomeArtista, $nomeFaixa),
            ),
            outrasDoArtista: $this->aplicarImagensService->aplicar($outras, $mapa),
        );
    }
}
