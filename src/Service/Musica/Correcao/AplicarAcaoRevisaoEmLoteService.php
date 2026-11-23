<?php

declare(strict_types=1);

namespace App\Service\Musica\Correcao;

use App\DataObject\Musica\AcaoRevisaoEmLoteDTO;
use App\DataObject\Musica\AcaoRevisaoPorFiltroDTO;
use App\Entity\Usuario;
use App\Enum\AcaoRevisaoVideo;
use App\Enum\OrigemClassificacao;
use App\Enum\StatusClassificacaoVideo;
use App\Enum\TipoRevisaoMusica;
use App\Exception\Musica\MusicaCatalogoException;
use App\Repository\VideoYoutubeRepository;
use App\Service\Musica\Projecao\ProjetarReproducoesYoutubeService;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class AplicarAcaoRevisaoEmLoteService
{
    private const int CONFIANCA_MANUAL = 100;
    private const int LIMITE_POR_FILTRO = 5000;
    private const int TAMANHO_BLOCO = 200;
    private const array TIPOS_COM_ACAO_POR_FILTRO = [TipoRevisaoMusica::SemVinculo, TipoRevisaoMusica::Ambiguo, TipoRevisaoMusica::Compilacao, TipoRevisaoMusica::Indisponivel];

    public function __construct(
        private VideoYoutubeRepository $videoRepository,
        private CacheAnaliseSpotifyService $cacheAnalise,
        private ProjetarReproducoesYoutubeService $projetarYoutube,
    ) {
    }

    public function executar(Usuario $usuario, AcaoRevisaoEmLoteDTO $dto): int
    {
        return $this->aplicar($usuario, array_values(array_unique($dto->videoUuids)), $dto->acao);
    }

    public function executarPorFiltro(Usuario $usuario, AcaoRevisaoPorFiltroDTO $dto): int
    {
        if (!in_array($dto->tipo, self::TIPOS_COM_ACAO_POR_FILTRO, true)) {
            throw MusicaCatalogoException::acaoEmLoteIndisponivel();
        }

        return $this->aplicar($usuario, $this->videoRepository->listarUuidsFiltradosParaRevisao($usuario, $dto->filtro(), self::LIMITE_POR_FILTRO), $dto->acao);
    }

    /**
     * @param list<string> $uuids
     */
    private function aplicar(Usuario $usuario, array $uuids, AcaoRevisaoVideo $acao): int
    {
        $status = AcaoRevisaoVideo::ManterCompilacao === $acao ? StatusClassificacaoVideo::Compilacao : StatusClassificacaoVideo::NaoMusica;
        $afetados = 0;

        foreach (array_chunk($uuids, self::TAMANHO_BLOCO) as $bloco) {
            $videos = $this->videoRepository->buscarPorUuidsOrdenados($usuario, $bloco);
            foreach ($videos as $video) {
                $video->classificar($status, OrigemClassificacao::Manual, self::CONFIANCA_MANUAL, null, null);
            }
            $this->videoRepository->flush();
            $this->projetarYoutube->projetarVideos($usuario, $videos);
            $afetados += count($videos);
        }

        if ($afetados > 0) {
            $this->cacheAnalise->invalidar($usuario);
        }

        return $afetados;
    }
}
