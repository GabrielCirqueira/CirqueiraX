<?php

declare(strict_types=1);

namespace App\Service\IdentificacaoMusica;

use App\DataObject\IdentificacaoMusica\ComponenteIdentificadoDTO;
use App\DataObject\IdentificacaoMusica\ResultadoIdentificacaoDTO;
use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Enum\StatusClassificacaoVideo;
use App\Enum\TipoIdentificacaoMusica;
use App\Enum\TipoVersaoMusica;
use App\Exception\YoutubeMusic\YoutubeMusicException;
use App\Repository\VideoYoutubeRepository;
use App\Service\Musica\Projecao\ProjetarReproducoesYoutubeService;
use Psr\Log\LoggerInterface;

final readonly class ReconfirmarRevisaoYoutubeService
{
    private const int TAMANHO_LOTE_FLUSH = 25;
    private const string CHAVE_ERRO = 'erro';
    private const string CHAVE_TIPO = 'tipo';
    private const string CHAVE_CONFIANCA = 'confianca';
    private const string CHAVE_VERSAO = 'versao';
    private const string CHAVE_AMBIGUO = 'ambiguo';
    private const string CHAVE_COMPONENTES = 'componentes';
    private const string CHAVE_ALTERNATIVAS = 'alternativas';
    private const string CHAVE_TITULO = 'titulo';
    private const string CHAVE_ARTISTAS = 'artistas';

    public function __construct(
        private VideoYoutubeRepository $videoRepository,
        private AplicarIdentificacaoVideoYoutubeService $aplicarIdentificacao,
        private IdentificarVideosYoutubeService $identificarVideos,
        private ProjetarReproducoesYoutubeService $projetarYoutube,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * @return array<string, int>
     */
    public function executar(Usuario $usuario, int $limite): array
    {
        $videos = $this->videoRepository->listarEmRevisao($usuario, $limite);
        if ([] === $videos) {
            return [];
        }

        $contagem = [];
        $paraReidentificar = [];
        $confirmados = [];
        $processadosNoLote = 0;

        foreach ($videos as $video) {
            if ($this->precisaReidentificarPorIa($video)) {
                $paraReidentificar[] = $video;

                continue;
            }

            $resultado = $this->reconstruirResultado($video);
            if (null === $resultado || !$this->isElegivelParaReconfirmacao($resultado)) {
                $contagem[StatusClassificacaoVideo::Revisar->value] = ($contagem[StatusClassificacaoVideo::Revisar->value] ?? 0) + 1;

                continue;
            }

            $status = $this->reconfirmarVideo($video, $resultado);
            $contagem[$status->value] = ($contagem[$status->value] ?? 0) + 1;
            if ($status->isContaComoMusica()) {
                $confirmados[] = $video;
            }

            ++$processadosNoLote;
            if (0 === $processadosNoLote % self::TAMANHO_LOTE_FLUSH) {
                $this->videoRepository->flush();
            }
        }

        $this->videoRepository->flush();
        $this->projetarYoutube->projetarVideos($usuario, $confirmados);

        if ([] === $paraReidentificar) {
            return $contagem;
        }

        foreach ($this->identificarVideos->executar($usuario, $paraReidentificar) as $status => $quantidade) {
            $contagem[$status] = ($contagem[$status] ?? 0) + $quantidade;
        }

        return $contagem;
    }

    private function precisaReidentificarPorIa(VideoYoutube $video): bool
    {
        $resposta = $video->respostaIa();

        return null === $resposta || isset($resposta[self::CHAVE_ERRO]);
    }

    private function isElegivelParaReconfirmacao(ResultadoIdentificacaoDTO $resultado): bool
    {
        if ($resultado->ambiguo || $resultado->confianca < AplicarIdentificacaoVideoYoutubeService::LIMITE_CONFIANCA_REVISAO) {
            return false;
        }

        if ([] === $resultado->componentes) {
            return false;
        }

        return TipoIdentificacaoMusica::Musica === $resultado->tipo || TipoIdentificacaoMusica::Mashup === $resultado->tipo;
    }

    private function reconfirmarVideo(VideoYoutube $video, ResultadoIdentificacaoDTO $resultado): StatusClassificacaoVideo
    {
        try {
            return $this->aplicarIdentificacao->executar($video, $resultado);
        } catch (YoutubeMusicException $erro) {
            $this->logger->warning('Reconfirmação pela busca do YouTube Music falhou; vídeo continua em revisão.', [
                'videoUuid' => $video->uuid()->toRfc4122(),
                'codigo' => $erro->getCode(),
            ]);

            return StatusClassificacaoVideo::Revisar;
        }
    }

    private function reconstruirResultado(VideoYoutube $video): ?ResultadoIdentificacaoDTO
    {
        $resposta = $video->respostaIa();
        if (null === $resposta) {
            return null;
        }

        $tipo = TipoIdentificacaoMusica::tryFrom((string) ($resposta[self::CHAVE_TIPO] ?? ''));
        if (null === $tipo) {
            return null;
        }

        $versao = TipoVersaoMusica::tryFrom((string) ($resposta[self::CHAVE_VERSAO] ?? '')) ?? TipoVersaoMusica::Original;
        $confianca = (int) ($resposta[self::CHAVE_CONFIANCA] ?? $video->confianca() ?? 0);
        $ambiguo = (bool) ($resposta[self::CHAVE_AMBIGUO] ?? false);

        return new ResultadoIdentificacaoDTO(
            id: $video->uuid()->toRfc4122(),
            tipo: $tipo,
            confianca: $confianca,
            versao: $versao,
            componentes: $this->mapearComponentes(is_array($resposta[self::CHAVE_COMPONENTES] ?? null) ? $resposta[self::CHAVE_COMPONENTES] : []),
            ambiguo: $ambiguo,
            alternativas: $this->mapearComponentes(is_array($resposta[self::CHAVE_ALTERNATIVAS] ?? null) ? $resposta[self::CHAVE_ALTERNATIVAS] : []),
        );
    }

    /**
     * @param array<mixed> $itens
     *
     * @return list<ComponenteIdentificadoDTO>
     */
    private function mapearComponentes(array $itens): array
    {
        $componentes = [];
        foreach ($itens as $item) {
            if (!is_array($item)) {
                continue;
            }

            $titulo = trim((string) ($item[self::CHAVE_TITULO] ?? ''));
            if ('' === $titulo) {
                continue;
            }

            $artistasBrutos = is_array($item[self::CHAVE_ARTISTAS] ?? null) ? $item[self::CHAVE_ARTISTAS] : [];
            $artistas = array_values(array_filter(array_map(static fn (mixed $artista): string => trim((string) $artista), $artistasBrutos), static fn (string $artista): bool => '' !== $artista));
            $componentes[] = new ComponenteIdentificadoDTO($titulo, $artistas);
        }

        return $componentes;
    }
}
