<?php

declare(strict_types=1);

namespace App\Service\Musica\Correcao;

use App\DataObject\Musica\UnirMusicasDTO;
use App\DataObject\Musica\UnirVariasMusicasDTO;
use App\Entity\MusicaCatalogo;
use App\Entity\Usuario;
use App\Exception\Musica\MusicaCatalogoException;
use App\Repository\MusicaCatalogoRepository;
use App\Service\Musica\Projecao\AtualizarMusicasEfetivasProjecaoService;
use App\Service\Spotify\CacheAnaliseSpotifyService;

final readonly class UnirMusicasCatalogoService
{
    public function __construct(
        private MusicaCatalogoRepository $musicaRepository,
        private CacheAnaliseSpotifyService $cacheAnalise,
        private AtualizarMusicasEfetivasProjecaoService $atualizarProjecao,
    ) {
    }

    public function executar(Usuario $usuario, UnirMusicasDTO $dto): MusicaCatalogo
    {
        $origem = $this->musicaRepository->buscarDoUsuario($usuario, $dto->origemUuid) ?? throw MusicaCatalogoException::musicaNaoEncontrada();
        $destino = ($this->musicaRepository->buscarDoUsuario($usuario, $dto->destinoUuid) ?? throw MusicaCatalogoException::musicaNaoEncontrada())->musicaEfetiva();

        if ($origem === $destino) {
            throw MusicaCatalogoException::uniaoComElaMesma();
        }

        $this->unir($origem, $destino);

        return $this->concluir($usuario, $destino);
    }

    public function executarVarias(Usuario $usuario, UnirVariasMusicasDTO $dto): MusicaCatalogo
    {
        $destino = ($this->musicaRepository->buscarDoUsuario($usuario, $dto->destinoUuid) ?? throw MusicaCatalogoException::musicaNaoEncontrada())->musicaEfetiva();

        foreach (array_unique($dto->origemUuids) as $origemUuid) {
            $origem = $this->musicaRepository->buscarDoUsuario($usuario, $origemUuid) ?? throw MusicaCatalogoException::musicaNaoEncontrada();
            if ($origem === $destino || $origem->musicaEfetiva() === $destino) {
                continue;
            }
            $this->unir($origem, $destino);
        }

        return $this->concluir($usuario, $destino);
    }

    private function unir(MusicaCatalogo $origem, MusicaCatalogo $destino): void
    {
        if ($origem->tipo() !== $destino->tipo()) {
            throw MusicaCatalogoException::tiposDiferentes();
        }

        $origem->unirA($destino);
    }

    private function concluir(Usuario $usuario, MusicaCatalogo $destino): MusicaCatalogo
    {
        $destino->confirmarManualmente();
        $this->musicaRepository->flush();
        $this->atualizarProjecao->executar($usuario);
        $this->cacheAnalise->invalidar($usuario);

        return $destino;
    }
}
