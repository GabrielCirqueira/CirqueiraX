<?php

declare(strict_types=1);

namespace App\Controller\Musica;

use App\Controller\Common\DefaultController;
use App\DataObject\Musica\BuscaCatalogoMusicaDTO;
use App\DataObject\Musica\ClassificarCanalDTO;
use App\DataObject\Musica\DefinirArtistasMusicaDTO;
use App\DataObject\Musica\DefinirComponentesMashupDTO;
use App\DataObject\Musica\DefinirMusicaVideoDTO;
use App\DataObject\Musica\DefinirMusicaVideosEmLoteDTO;
use App\DataObject\Musica\FiltroRevisaoMusicaDTO;
use App\DataObject\Musica\SepararMusicaDTO;
use App\DataObject\Musica\UnirArtistasDTO;
use App\DataObject\Musica\UnirMusicasDTO;
use App\Entity\Usuario;
use App\Exception\Musica\MusicaCatalogoException;
use App\Serializer\MusicaCatalogoSerializer;
use App\Service\Musica\Correcao\BuscarCatalogoMusicaService;
use App\Service\Musica\Correcao\ClassificarCanalYoutubeService;
use App\Service\Musica\Correcao\DefinirArtistasMusicaService;
use App\Service\Musica\Correcao\DefinirComponentesMashupService;
use App\Service\Musica\Correcao\DefinirMusicaDoVideoService;
use App\Service\Musica\Correcao\DesfazerUniaoMusicaService;
use App\Service\Musica\Correcao\SepararVideoDaMusicaService;
use App\Service\Musica\Correcao\UnirArtistasCatalogoService;
use App\Service\Musica\Correcao\UnirMusicasCatalogoService;
use App\Service\Musica\ListarRevisaoMusicaService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/musica', name: 'api_musica_correcao_')]
final class MusicaCorrecaoController extends DefaultController
{
    public function __construct(
        private readonly ListarRevisaoMusicaService $listarRevisao,
        private readonly DefinirMusicaDoVideoService $definirMusicaDoVideo,
        private readonly UnirMusicasCatalogoService $unirMusicas,
        private readonly DesfazerUniaoMusicaService $desfazerUniao,
        private readonly SepararVideoDaMusicaService $separarVideo,
        private readonly ClassificarCanalYoutubeService $classificarCanal,
        private readonly UnirArtistasCatalogoService $unirArtistas,
        private readonly DefinirComponentesMashupService $definirComponentes,
        private readonly DefinirArtistasMusicaService $definirArtistas,
        private readonly MusicaCatalogoSerializer $serializer,
        private readonly BuscarCatalogoMusicaService $buscarCatalogo,
    ) {
    }

    #[Route('/revisao', name: 'revisao', methods: ['GET'])]
    public function revisao(#[CurrentUser] Usuario $usuario, #[MapQueryString] FiltroRevisaoMusicaDTO $filtro = new FiltroRevisaoMusicaDTO()): Response
    {
        return $this->success($this->listarRevisao->executar($usuario, $filtro));
    }

    #[Route('/revisao/contagens', name: 'revisao_contagens', methods: ['GET'])]
    public function contagensRevisao(#[CurrentUser] Usuario $usuario): Response
    {
        return $this->success($this->listarRevisao->contar($usuario));
    }

    #[Route('/revisao/videos/lote', name: 'definir_musica_lote', methods: ['POST'])]
    public function definirMusicaEmLote(#[CurrentUser] Usuario $usuario, #[MapRequestPayload] DefinirMusicaVideosEmLoteDTO $dto): Response
    {
        return $this->success(['videosAfetados' => $this->definirMusicaDoVideo->executarEmLote($usuario, $dto)]);
    }

    #[Route('/catalogo/musicas', name: 'buscar_musicas', methods: ['GET'])]
    public function buscarMusicas(#[CurrentUser] Usuario $usuario, #[MapQueryString] BuscaCatalogoMusicaDTO $dto = new BuscaCatalogoMusicaDTO()): Response
    {
        return $this->success($this->buscarCatalogo->buscarMusicas($usuario, $dto));
    }

    #[Route('/catalogo/artistas', name: 'buscar_artistas', methods: ['GET'])]
    public function buscarArtistas(#[CurrentUser] Usuario $usuario, #[MapQueryString] BuscaCatalogoMusicaDTO $dto = new BuscaCatalogoMusicaDTO()): Response
    {
        return $this->success($this->buscarCatalogo->buscarArtistas($usuario, $dto));
    }

    #[Route('/revisao/videos/{uuid}/musica', name: 'definir_musica_video', methods: ['POST'])]
    public function definirMusicaDoVideo(#[CurrentUser] Usuario $usuario, string $uuid, #[MapRequestPayload] DefinirMusicaVideoDTO $dto): Response
    {
        return $this->success($this->serializer->serializarVideo($this->definirMusicaDoVideo->executar($usuario, $uuid, $dto)));
    }

    #[Route('/catalogo/unir', name: 'unir_musicas', methods: ['POST'])]
    public function unirMusicas(#[CurrentUser] Usuario $usuario, #[MapRequestPayload] UnirMusicasDTO $dto): Response
    {
        return $this->success($this->serializer->serializarMusica($this->unirMusicas->executar($usuario, $dto)));
    }

    #[Route('/catalogo/separar', name: 'separar', methods: ['POST'])]
    public function separar(#[CurrentUser] Usuario $usuario, #[MapRequestPayload] SepararMusicaDTO $dto): Response
    {
        if (null !== $dto->videoUuid) {
            return $this->success($this->serializer->serializarVideo($this->separarVideo->executar($usuario, $dto->videoUuid)));
        }

        if (null === $dto->musicaUuid) {
            throw MusicaCatalogoException::separacaoSemAlvo();
        }

        return $this->success($this->serializer->serializarMusica($this->desfazerUniao->executar($usuario, $dto->musicaUuid)));
    }

    #[Route('/catalogo/{uuid}/artistas', name: 'definir_artistas', methods: ['PUT'])]
    public function definirArtistas(#[CurrentUser] Usuario $usuario, string $uuid, #[MapRequestPayload] DefinirArtistasMusicaDTO $dto): Response
    {
        return $this->success($this->serializer->serializarMusica($this->definirArtistas->executar($usuario, $uuid, $dto)));
    }

    #[Route('/canais/classificar', name: 'classificar_canal', methods: ['POST'])]
    public function classificarCanal(#[CurrentUser] Usuario $usuario, #[MapRequestPayload] ClassificarCanalDTO $dto): Response
    {
        return $this->success(['videosAfetados' => $this->classificarCanal->executar($usuario, $dto)]);
    }

    #[Route('/artistas/unir', name: 'unir_artistas', methods: ['POST'])]
    public function unirArtistas(#[CurrentUser] Usuario $usuario, #[MapRequestPayload] UnirArtistasDTO $dto): Response
    {
        return $this->success($this->serializer->serializarArtista($this->unirArtistas->executar($usuario, $dto)));
    }

    #[Route('/mashups/{uuid}/componentes', name: 'definir_componentes', methods: ['PUT'])]
    public function definirComponentes(#[CurrentUser] Usuario $usuario, string $uuid, #[MapRequestPayload] DefinirComponentesMashupDTO $dto): Response
    {
        return $this->success($this->serializer->serializarMusica($this->definirComponentes->executar($usuario, $uuid, $dto)));
    }
}
