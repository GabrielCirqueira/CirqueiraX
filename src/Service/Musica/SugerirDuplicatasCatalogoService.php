<?php

declare(strict_types=1);

namespace App\Service\Musica;

use App\Entity\DuplicataDescartada;
use App\Entity\Usuario;
use App\Repository\DuplicataDescartadaRepository;
use App\Repository\MusicaCatalogoRepository;

final readonly class SugerirDuplicatasCatalogoService
{
    public const int SIMILARIDADE_MINIMA_ARTISTA = 75;
    private const string SEPARADOR_CHAVE = '|';

    public function __construct(
        private MusicaCatalogoRepository $musicaRepository,
        private DuplicataDescartadaRepository $duplicataRepository,
    ) {
    }

    /**
     * @return list<array{0: string, 1: string}>
     */
    public function executar(Usuario $usuario): array
    {
        $porTitulo = [];
        foreach ($this->musicaRepository->listarComTituloRepetido($usuario) as $musica) {
            [$titulo, $artista] = array_pad(explode(self::SEPARADOR_CHAVE, $musica['chave'], 2), 2, '');
            $porTitulo[$titulo][] = ['uuid' => $musica['uuid'], 'artista' => $artista, 'semArtista' => 0 === $musica['totalArtistas']];
        }

        $descartadas = $this->duplicataRepository->listarChavesDoUsuario($usuario);
        $pares = [];
        foreach ($porTitulo as $musicas) {
            $total = count($musicas);
            for ($i = 0; $i < $total; ++$i) {
                for ($j = $i + 1; $j < $total; ++$j) {
                    if (isset($descartadas[DuplicataDescartada::chavePar($musicas[$i]['uuid'], $musicas[$j]['uuid'])])) {
                        continue;
                    }
                    if ($this->isArtistaParecido($musicas[$i], $musicas[$j])) {
                        $pares[] = [$musicas[$i]['uuid'], $musicas[$j]['uuid']];
                    }
                }
            }
        }

        return $pares;
    }

    /**
     * @param array{artista: string, semArtista: bool} $primeira
     * @param array{artista: string, semArtista: bool} $segunda
     */
    private function isArtistaParecido(array $primeira, array $segunda): bool
    {
        if ($primeira['semArtista'] || $segunda['semArtista']) {
            return true;
        }

        if ('' === $primeira['artista'] || '' === $segunda['artista']) {
            return $primeira['artista'] === $segunda['artista'];
        }

        if (str_contains($primeira['artista'], $segunda['artista']) || str_contains($segunda['artista'], $primeira['artista'])) {
            return true;
        }

        similar_text($primeira['artista'], $segunda['artista'], $porcentagem);

        return $porcentagem >= self::SIMILARIDADE_MINIMA_ARTISTA;
    }
}
