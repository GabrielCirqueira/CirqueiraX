<?php

declare(strict_types=1);

namespace App\Service\Musica;

use App\Entity\Usuario;
use App\Repository\MusicaCatalogoRepository;

final readonly class SugerirDuplicatasCatalogoService
{
    public const int SIMILARIDADE_MINIMA_ARTISTA = 75;
    private const string SEPARADOR_CHAVE = '|';

    public function __construct(
        private MusicaCatalogoRepository $musicaRepository,
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
            $porTitulo[$titulo][] = ['uuid' => $musica['uuid'], 'artista' => $artista];
        }

        $pares = [];
        foreach ($porTitulo as $musicas) {
            $total = count($musicas);
            for ($i = 0; $i < $total; ++$i) {
                for ($j = $i + 1; $j < $total; ++$j) {
                    if ($this->isArtistaParecido($musicas[$i]['artista'], $musicas[$j]['artista'])) {
                        $pares[] = [$musicas[$i]['uuid'], $musicas[$j]['uuid']];
                    }
                }
            }
        }

        return $pares;
    }

    private function isArtistaParecido(string $primeiro, string $segundo): bool
    {
        if ('' === $primeiro || '' === $segundo || str_contains($primeiro, $segundo) || str_contains($segundo, $primeiro)) {
            return true;
        }

        similar_text($primeiro, $segundo, $porcentagem);

        return $porcentagem >= self::SIMILARIDADE_MINIMA_ARTISTA;
    }
}
