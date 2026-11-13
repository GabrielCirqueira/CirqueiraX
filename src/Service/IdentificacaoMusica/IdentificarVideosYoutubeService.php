<?php

declare(strict_types=1);

namespace App\Service\IdentificacaoMusica;

use App\DataObject\IdentificacaoMusica\EntradaIdentificacaoDTO;
use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Enum\ClassificacaoCanal;
use App\Enum\FinalidadeConsumoIa;
use App\Enum\OrigemClassificacao;
use App\Enum\StatusClassificacaoVideo;
use App\Enum\TipoVersaoMusica;
use App\Exception\IdentificacaoMusica\IdentificacaoException;
use App\Exception\YoutubeMusic\YoutubeMusicException;
use App\Interface\IdentificadorMusicaInterface;
use App\Repository\RegraCanalYoutubeRepository;
use App\Repository\VideoYoutubeRepository;
use App\Service\Ia\RegistrarConsumoIaService;
use App\Service\Musica\NormalizarTextoMusicaService;
use App\Service\Musica\ObterMusicaCatalogoService;
use App\Service\Musica\Projecao\ProjetarReproducoesYoutubeService;
use App\Service\YoutubeData\AtualizarDetalhesVideosYoutubeService;
use Psr\Log\LoggerInterface;

final readonly class IdentificarVideosYoutubeService
{
    public const int PAUSA_ENTRE_LOTES_SEGUNDOS = 1;
    private const int CONFIANCA_REGRA = 100;
    private const string SUFIXO_CANAL_TOPIC = ' - Topic';
    private const string ERRO_RESPOSTA_INVALIDA = 'resposta_invalida';

    public function __construct(
        private IdentificadorMusicaInterface $identificador,
        private AplicarIdentificacaoVideoYoutubeService $aplicarIdentificacao,
        private AtualizarDetalhesVideosYoutubeService $atualizarDetalhes,
        private ObterMusicaCatalogoService $obterMusica,
        private NormalizarTextoMusicaService $normalizador,
        private RegraCanalYoutubeRepository $regraCanalRepository,
        private VideoYoutubeRepository $videoRepository,
        private RegistrarConsumoIaService $registrarConsumo,
        private ProjetarReproducoesYoutubeService $projetarYoutube,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * @param list<VideoYoutube> $videos
     *
     * @return array<string, int>
     */
    public function executar(Usuario $usuario, array $videos): array
    {
        $contagem = [];
        $restantes = [];

        foreach ($videos as $video) {
            if ($video->usuario() !== $usuario || $video->isClassificadoManualmente()) {
                continue;
            }

            $status = $this->aplicarRegrasSemIa($usuario, $video);
            if (null === $status) {
                $restantes[] = $video;

                continue;
            }
            $contagem[$status->value] = ($contagem[$status->value] ?? 0) + 1;
        }
        $this->videoRepository->flush();

        $restantes = $this->enriquecer($restantes);
        foreach (array_chunk($restantes, IdentificadorMusicaInterface::TAMANHO_LOTE_IDENTIFICACAO) as $indice => $lote) {
            if ($indice > 0) {
                sleep(self::PAUSA_ENTRE_LOTES_SEGUNDOS);
            }

            $resultadoLote = $this->identificarLote($usuario, $lote);
            if (null === $resultadoLote) {
                break;
            }

            foreach ($resultadoLote as $status => $quantidade) {
                $contagem[$status] = ($contagem[$status] ?? 0) + $quantidade;
            }
        }

        $this->projetarYoutube->projetarVideos($usuario, array_values(array_filter($videos, static fn (VideoYoutube $video): bool => $video->usuario() === $usuario)));

        return $contagem;
    }

    private function aplicarRegrasSemIa(Usuario $usuario, VideoYoutube $video): ?StatusClassificacaoVideo
    {
        $regra = $this->regraCanalRepository->buscarPorCanal($usuario, $this->normalizador->normalizar($video->canal()));
        if (null !== $regra && ClassificacaoCanal::NaoMusica === $regra->classificacao()) {
            $video->classificar(StatusClassificacaoVideo::NaoMusica, OrigemClassificacao::RegraCanal, self::CONFIANCA_REGRA, null, null);

            return StatusClassificacaoVideo::NaoMusica;
        }

        if (!$video->isFaixaOficial()) {
            return null;
        }

        $artistas = $this->normalizador->separarArtistas(str_replace(self::SUFIXO_CANAL_TOPIC, '', $video->canal()));
        if ([] === $artistas) {
            return null;
        }

        $musica = $this->obterMusica->obterMusica($usuario, $video->titulo(), $artistas, null, $video->urlCapa(), $video->videoId());
        $video->classificar(StatusClassificacaoVideo::Musica, OrigemClassificacao::Regra, self::CONFIANCA_REGRA, TipoVersaoMusica::Original, $musica);

        return StatusClassificacaoVideo::Musica;
    }

    /**
     * @param list<VideoYoutube> $videos
     *
     * @return list<VideoYoutube>
     */
    private function enriquecer(array $videos): array
    {
        $semDetalhes = array_values(array_filter($videos, static fn (VideoYoutube $video): bool => null === $video->detalhesAtualizadosEm() && (null === $video->duracaoMs() || null === $video->categoriaYoutube())));
        if ([] !== $semDetalhes) {
            $this->atualizarDetalhes->executar($semDetalhes);
        }

        return array_values(array_filter($videos, static fn (VideoYoutube $video): bool => StatusClassificacaoVideo::Indisponivel !== $video->status()));
    }

    /**
     * @param list<VideoYoutube> $lote
     *
     * @return array<string, int>|null
     */
    private function identificarLote(Usuario $usuario, array $lote): ?array
    {
        $entradas = array_map(static fn (VideoYoutube $video): EntradaIdentificacaoDTO => new EntradaIdentificacaoDTO(
            $video->uuid()->toRfc4122(),
            $video->titulo(),
            $video->canal(),
            $video->duracaoMs(),
            $video->categoriaYoutube(),
            $video->descricaoResumo(),
        ), $lote);

        try {
            $resultado = $this->identificador->identificar($entradas);
        } catch (IdentificacaoException $erro) {
            return $this->tratarFalhaLote($usuario, $lote, $erro);
        }

        $this->registrarConsumo->executar($usuario, FinalidadeConsumoIa::IdentificacaoMusica, $resultado->consumo);

        $contagem = [];
        $invalidos = array_flip($resultado->idsInvalidos);
        foreach ($lote as $video) {
            $id = $video->uuid()->toRfc4122();
            if (isset($invalidos[$id])) {
                $video->classificar(StatusClassificacaoVideo::Revisar, OrigemClassificacao::Ia, null, null, null, ['erro' => self::ERRO_RESPOSTA_INVALIDA]);
                $contagem[StatusClassificacaoVideo::Revisar->value] = ($contagem[StatusClassificacaoVideo::Revisar->value] ?? 0) + 1;

                continue;
            }

            if (!isset($resultado->resultados[$id])) {
                continue;
            }

            try {
                $status = $this->aplicarIdentificacao->executar($video, $resultado->resultados[$id]);
            } catch (YoutubeMusicException $erro) {
                $this->logger->warning('Confirmação pela busca do YouTube Music falhou; vídeo continua pendente.', ['videoUuid' => $video->uuid()->toRfc4122(), 'codigo' => $erro->getCode()]);

                continue;
            }
            $contagem[$status->value] = ($contagem[$status->value] ?? 0) + 1;
        }
        $this->videoRepository->flush();

        return $contagem;
    }

    /**
     * @param list<VideoYoutube> $lote
     *
     * @return array<string, int>|null
     */
    private function tratarFalhaLote(Usuario $usuario, array $lote, IdentificacaoException $erro): ?array
    {
        $this->logger->warning('Identificação por IA falhou.', ['codigo' => $erro->getCode(), 'videos' => count($lote)]);
        $resposta = $erro->resposta();
        if (!$erro->isRespostaInvalida() || null === $resposta) {
            return null;
        }

        $this->registrarConsumo->executar($usuario, FinalidadeConsumoIa::IdentificacaoMusica, $resposta);
        foreach ($lote as $video) {
            $video->classificar(StatusClassificacaoVideo::Revisar, OrigemClassificacao::Ia, null, null, null, ['erro' => self::ERRO_RESPOSTA_INVALIDA]);
        }
        $this->videoRepository->flush();

        return [StatusClassificacaoVideo::Revisar->value => count($lote)];
    }
}
