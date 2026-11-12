<?php

declare(strict_types=1);

namespace App\Service\Musica\Correcao;

use App\DataObject\Musica\DescartarDuplicataDTO;
use App\Entity\DuplicataDescartada;
use App\Entity\Usuario;
use App\Exception\Musica\MusicaCatalogoException;
use App\Repository\DuplicataDescartadaRepository;
use App\Repository\MusicaCatalogoRepository;

final readonly class DescartarDuplicataCatalogoService
{
    public function __construct(
        private MusicaCatalogoRepository $musicaRepository,
        private DuplicataDescartadaRepository $duplicataRepository,
    ) {
    }

    public function executar(Usuario $usuario, DescartarDuplicataDTO $dto): void
    {
        if ($dto->primeiraUuid === $dto->segundaUuid) {
            throw MusicaCatalogoException::uniaoComElaMesma();
        }

        $uuids = [$dto->primeiraUuid, $dto->segundaUuid];
        sort($uuids);
        [$primeiraUuid, $segundaUuid] = $uuids;

        $primeira = $this->musicaRepository->buscarDoUsuario($usuario, $primeiraUuid) ?? throw MusicaCatalogoException::musicaNaoEncontrada();
        $segunda = $this->musicaRepository->buscarDoUsuario($usuario, $segundaUuid) ?? throw MusicaCatalogoException::musicaNaoEncontrada();

        if (null !== $this->duplicataRepository->buscarPar($usuario, $primeira, $segunda)) {
            return;
        }

        $this->duplicataRepository->salvar(new DuplicataDescartada($usuario, $primeira, $segunda));
    }
}
