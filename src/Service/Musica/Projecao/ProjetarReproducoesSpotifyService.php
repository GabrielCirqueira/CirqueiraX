<?php

declare(strict_types=1);

namespace App\Service\Musica\Projecao;

use App\Entity\Usuario;
use App\Repository\ReproducaoMusicalRepository;
use App\Repository\ReproducaoSpotifyRepository;
use App\Repository\UsuarioRepository;
use App\Repository\VinculoMusicaSpotifyRepository;
use App\Service\Musica\NormalizarTextoMusicaService;
use App\Service\Spotify\CacheAnaliseSpotifyService;
use DateTimeImmutable;

final readonly class ProjetarReproducoesSpotifyService
{
    public const int TAMANHO_LOTE = 2000;
    private const string SEPARADOR_IDENTIDADE = '|';

    public function __construct(
        private ReproducaoSpotifyRepository $reproducaoSpotifyRepository,
        private ReproducaoMusicalRepository $reproducaoMusicalRepository,
        private VinculoMusicaSpotifyRepository $vinculoRepository,
        private UsuarioRepository $usuarioRepository,
        private NormalizarTextoMusicaService $normalizador,
        private CacheAnaliseSpotifyService $cacheAnalise,
    ) {
    }

    /**
     * @param callable(int, int): void|null $aoConcluirLote
     *
     * @return array{lidas: int, projetadas: int, semVinculo: int, removidas: int}
     */
    public function executar(Usuario $usuario, ?DateTimeImmutable $desde = null, ?DateTimeImmutable $ate = null, ?callable $aoConcluirLote = null): array
    {
        $usuarioId = (int) $usuario->getId();
        $mapa = $this->vinculoRepository->mapearMusicasPorIdentidade($usuario, self::SEPARADOR_IDENTIDADE);
        $identidades = [];
        $resultado = ['lidas' => 0, 'projetadas' => 0, 'semVinculo' => 0, 'removidas' => 0];
        $ultimo = null;

        do {
            $usuarioAtual = $this->usuarioRepository->find($usuarioId) ?? $usuario;
            $linhas = $this->reproducaoSpotifyRepository->listarParaProjecao($usuarioAtual, $ultimo, $desde, $ate, self::TAMANHO_LOTE);
            $vinculos = [];

            foreach ($linhas as $linha) {
                $ultimo = $linha['uuid'];
                $chave = $linha['nome'].self::SEPARADOR_IDENTIDADE.$linha['artista'];
                $identidades[$chave] ??= $this->normalizador->normalizar($linha['nome']).self::SEPARADOR_IDENTIDADE.$this->normalizador->normalizar($linha['artista']);
                $musica = $mapa[$identidades[$chave]] ?? null;

                if (null === $musica) {
                    ++$resultado['semVinculo'];

                    continue;
                }

                $vinculos[] = ['origem' => $linha['uuid'], 'musica' => $musica];
            }

            $resultado['lidas'] += count($linhas);
            $this->reproducaoMusicalRepository->gravarSpotify($usuarioAtual, $vinculos);
            $resultado['projetadas'] += count($vinculos);
            $this->reproducaoMusicalRepository->limparMemoria();

            if (null !== $aoConcluirLote) {
                $aoConcluirLote($resultado['lidas'], $resultado['projetadas']);
            }
        } while (self::TAMANHO_LOTE === count($linhas));

        if (null === $desde && null === $ate) {
            $resultado['removidas'] = $this->reproducaoMusicalRepository->removerOrfasSpotify($this->usuarioRepository->find($usuarioId) ?? $usuario);
        }

        $this->cacheAnalise->invalidar($this->usuarioRepository->find($usuarioId) ?? $usuario);

        return $resultado;
    }
}
