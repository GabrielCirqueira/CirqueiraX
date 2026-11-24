<?php

declare(strict_types=1);

namespace App\Service\Usuario;

use App\DataObject\Spotify\Analise\ArtistaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\MusicaAnaliseSpotifyDTO;
use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;
use App\DataObject\Usuario\ResumoAtividadeUsuarioDTO;
use App\Entity\Usuario;
use App\Enum\FiltroFonteMusica;
use App\Repository\AnaliseReproducaoMusicalRepository;
use App\Repository\ResumoAtividadeUsuarioRepository;
use App\Service\Spotify\EnriquecerImagensSpotifyService;

final readonly class ObterResumoAtividadeUsuarioService
{
    private const int LIMITE_TOPO = 5;
    private const int PRIORIDADE_IMAGENS = 2;

    public function __construct(
        private ObterUsuarioService $obterUsuario,
        private ResumoAtividadeUsuarioRepository $resumoRepository,
        private AnaliseReproducaoMusicalRepository $analiseRepository,
        private EnriquecerImagensSpotifyService $enriquecerImagens,
    ) {}

    public function executar(int $id): ResumoAtividadeUsuarioDTO
    {
        $usuario = $this->obterUsuario->executar($id);
        $todos = PeriodoAnaliseSpotifyDTO::todos();
        $agora = PeriodoAnaliseSpotifyDTO::agoraCalendario();
        $mesAtual = PeriodoAnaliseSpotifyDTO::doMes((int) $agora->format('Y'), (int) $agora->format('n'));

        [$topMusicas, $topArtistas] = $this->listarTopos($usuario, $todos);

        return new ResumoAtividadeUsuarioDTO(
            midias: $this->resumoRepository->resumirMidiasPorOrigem($usuario),
            audios: $this->resumoRepository->resumirAudios($usuario),
            transcricoes: $this->resumoRepository->resumirTranscricoes($usuario),
            livrosAudio: $this->resumoRepository->resumirLivrosAudio($usuario),
            youtube: $this->resumoRepository->resumirYoutube($usuario),
            ia: $this->resumoRepository->resumirConsumoIa($usuario),
            transferencias: $this->resumoRepository->resumirTransferencias($usuario),
            contas: $this->resumoRepository->resumirContasConectadas($usuario),
            musicaTotais: $this->totaisComDatasLocais($this->analiseRepository->calcularTotais($usuario, $todos, FiltroFonteMusica::Todas)),
            musicaMes: $this->totaisComDatasLocais($this->analiseRepository->calcularTotais($usuario, $mesAtual, FiltroFonteMusica::Todas)),
            musicaExclusividade: $this->analiseRepository->contarMusicasPorExclusividade($usuario),
            topMusicas: $topMusicas,
            topArtistas: $topArtistas,
        );
    }

    /**
     * @return array{0: list<MusicaAnaliseSpotifyDTO>, 1: list<ArtistaAnaliseSpotifyDTO>}
     */
    private function listarTopos(Usuario $usuario, PeriodoAnaliseSpotifyDTO $periodo): array
    {
        $musicas = $this->analiseRepository->listarRankingMusicas($usuario, $periodo, FiltroFonteMusica::Todas, self::LIMITE_TOPO);
        $artistas = $this->analiseRepository->listarRankingArtistas($usuario, $periodo, FiltroFonteMusica::Todas, self::LIMITE_TOPO);

        $mapa = $this->enriquecerImagens->enriquecerEAgendar(
            usuario: $usuario,
            faixas: array_map(static fn (MusicaAnaliseSpotifyDTO $musica): array => $musica->paraEnriquecimento(), $musicas),
            artistas: array_map(static fn (ArtistaAnaliseSpotifyDTO $artista): array => $artista->paraEnriquecimento(), $artistas),
            prioridade: self::PRIORIDADE_IMAGENS,
        );

        return [
            array_map(static fn (MusicaAnaliseSpotifyDTO $musica): MusicaAnaliseSpotifyDTO => $musica->comImagem($mapa), $musicas),
            array_map(static fn (ArtistaAnaliseSpotifyDTO $artista): ArtistaAnaliseSpotifyDTO => $artista->comImagem($mapa), $artistas),
        ];
    }

    /**
     * @param array<string, mixed> $totais
     *
     * @return array<string, mixed>
     */
    private function totaisComDatasLocais(array $totais): array
    {
        $totais['primeira'] = PeriodoAnaliseSpotifyDTO::utcParaIsoLocal(is_string($totais['primeira'] ?? null) ? $totais['primeira'] : null);
        $totais['ultima'] = PeriodoAnaliseSpotifyDTO::utcParaIsoLocal(is_string($totais['ultima'] ?? null) ? $totais['ultima'] : null);

        return $totais;
    }
}
